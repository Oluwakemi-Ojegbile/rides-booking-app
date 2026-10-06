const Ride = require("../models/Ride");
const mongoose = require("mongoose");
const DriverProfile = require("../models/DriverProfile");

const {
  applyTransition,
  assertValidTransition,
} = require("../services/rideStateMachine");

const {
  calculateFareEstimate,
  calculateDistanceKm,
} = require("../services/pricingEngine");

const { findAvailableDrivers } = require("../services/matchingEngine");

const {
  notifyRideRequested,
  notifyRideStatusChanged,
} = require("../services/notificationService");

const { sendError, sendSuccess } = require("../services/apiResponse");

const { presentRide } = require("../services/ridePresenter");

const ACTIVE_RIDE_STATUSES = ["accepted", "arrived", "in_progress"];
const VEHICLE_FIELDS = [
  "vehicleMake",
  "vehicleModel",
  "vehicleColor",
  "plateNumber",
];
const RIDER_CURRENT_STATUSES = ["requested", ...ACTIVE_RIDE_STATUSES];
const TERMINAL_STATUSES = [
  "completed",
  "cancelled_by_rider",
  "cancelled_by_driver",
];

function createHttpError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function runWithTransaction(work) {
  const session = await Ride.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (
      /Transaction numbers are only allowed|replica set/i.test(error.message)
    ) {
      return work(null);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

function queryWithSession(query, session) {
  return session ? query.session(session) : query;
}

function validateRideLocations(pickup, destination) {
  const locations = [pickup, destination];
  const valid = locations.every(
    (location) =>
      location &&
      typeof location.address === "string" &&
      location.address.trim() &&
      Number.isFinite(location.latitude) &&
      Number.isFinite(location.longitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90 &&
      location.longitude >= -180 &&
      location.longitude <= 180,
  );
  if (!valid) return "Pickup and destination with valid coordinates are required";
  if (
    Number(pickup.latitude) === Number(destination.latitude) &&
    Number(pickup.longitude) === Number(destination.longitude)
  ) {
    return "Pickup and destination must be different";
  }
  return null;
}

async function estimateRide(req, res) {
  const { pickup, destination } = req.body;
  const validationError = validateRideLocations(pickup, destination);
  if (validationError) return sendError(res, validationError, 400);

  const distanceInKm = Number(calculateDistanceKm(pickup, destination).toFixed(2));
  const estimate = calculateFareEstimate({ distanceKm: distanceInKm });
  return sendSuccess(res, "Fare estimate calculated", { distanceInKm, ...estimate });
}

async function createRide(req, res) {
  try {
    const { pickup, destination } = req.body;
    const validationError = validateRideLocations(pickup, destination);
    if (validationError) return sendError(res, validationError, 400);

  const existingRide = await Ride.exists({
    riderId: req.user.id,
    status: { $in: RIDER_CURRENT_STATUSES },
  });

  if (existingRide) {
      return sendError(res, "You already have an active ride", 409);
  }

    const distanceInKm = Number(calculateDistanceKm(pickup, destination).toFixed(2));

    const estimate = calculateFareEstimate({ distanceKm: distanceInKm }).fareEstimate;

    const ride = await Ride.create({
      riderId: req.user.id,
      pickup,
      destination,
      distanceInKm,
      estimatedFare: estimate,
    });

    const drivers = await findAvailableDrivers({ pickup });

    notifyRideRequested({ ride, drivers });

    return sendSuccess(
      res,
      "Ride requested",
      {
        ride,
        matching: { nearbyDrivers: drivers.length },
      },
      201,
    );
  } catch {
    return sendError(res, "Could not create ride", 500);
  }
}

async function getRide(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return sendError(res, "Invalid ride identifier", 400);
    const ride = await Ride.findById(req.params.id);
    if (!ride) return sendError(res, "Ride not found", 404);

    return sendSuccess(res, "Ride retrieved", {
      ride: await presentRide(ride),
    });
  } catch (error) {
    return next(error);
  }
}

async function getAvailableRides(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const profile = await DriverProfile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return sendError(res, "Driver profile not found", 404);
    }

    if (VEHICLE_FIELDS.some((field) => !profile[field]?.trim())) {
      return sendError(
        res,
        "Complete vehicle information before viewing requests",
        409,
      );
    }

    const activeRide = await Ride.findOne({
      driverId: req.user.id,
      status: { $in: ACTIVE_RIDE_STATUSES },
    }).select("_id");

    if (!profile.isAvailable || profile.activeRideId || activeRide) {
      return sendError(
        res,
        "Go online and finish any active ride to view requests",
        409,
      );
    }

    const filter = {
      status: "requested",
      driverId: null,
    };

    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .sort({ requestedAt: 1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit),

      Ride.countDocuments(filter),
    ]);

    return sendSuccess(res, "Available rides retrieved", {
      rides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function acceptRide(req, res) {
  let reservedProfile;
  let rideClaimed = false;

  try {
    assertValidTransition("requested", "accepted");

    const profile = await DriverProfile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return sendError(res, "Driver profile not found", 404);
    }

    if (VEHICLE_FIELDS.some((field) => !profile[field]?.trim())) {
      return sendError(
        res,
        "Complete vehicle information before accepting requests",
        409,
      );
    }

    const activeRide = await Ride.findOne({
      driverId: req.user.id,
      status: { $in: ACTIVE_RIDE_STATUSES },
    }).select("_id");

    if (activeRide) {
      return sendError(res, "You already have an active ride", 409);
    }

    reservedProfile = await DriverProfile.findOneAndUpdate(
      {
        userId: req.user.id,
        isAvailable: true,
        activeRideId: null,
        $and: VEHICLE_FIELDS.map((field) => ({
          [field]: {
            $exists: true,
            $ne: "",
          },
        })),
      },
      {
        $set: {
          activeRideId: req.params.id,
          isAvailable: false,
        },
      },
      {
        new: true,
      },
    );

    if (!reservedProfile) {
      const currentProfile = await DriverProfile.findOne({
        userId: req.user.id,
      });

      if (!currentProfile) {
        return sendError(res, "Driver profile not found", 404);
      }

      return sendError(
        res,
        "You must be available and have no active ride to accept requests",
        409,
      );
    }

    const ride = await Ride.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "requested",
        driverId: null,
      },
      {
        $set: {
          driverId: req.user.id,
          status: "accepted",
          acceptedAt: new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!ride) {
      await DriverProfile.updateOne(
        {
          _id: reservedProfile._id,
          activeRideId: req.params.id,
        },
        {
          $set: {
            activeRideId: null,
            isAvailable: true,
          },
        },
      );

      const existingRide = await Ride.exists({
        _id: req.params.id,
      });

      return sendError(
        res,
        existingRide
          ? "Ride has already been accepted or is no longer available"
          : "Ride not found",
        existingRide ? 409 : 404,
      );
    }

    rideClaimed = true;

    const populatedRide = await presentRide(ride);

    notifyRideStatusChanged({ ride });

    return sendSuccess(res, "Ride accepted", {
      ride: populatedRide,
    });
  } catch (error) {
    if (reservedProfile && !rideClaimed) {
      await DriverProfile.updateOne(
        {
          _id: reservedProfile._id,
          activeRideId: req.params.id,
        },
        {
          $set: {
            activeRideId: null,
            isAvailable: true,
          },
        },
      );
    }

    const statusCode = error.status || (error.name === "CastError" ? 400 : 500);

    return res.status(statusCode).json({
      error: statusCode >= 500 ? "Could not accept ride" : error.message,
    });
  }
}

async function getCurrentRiderRide(req, res, next) {
  try {
    const ride = await Ride.findOne({
      riderId: req.user.id,
      status: {
        $in: RIDER_CURRENT_STATUSES,
      },
    }).sort({
      requestedAt: -1,
    });

    return sendSuccess(res, "Current ride retrieved", {
      ride: ride ? await presentRide(ride) : null,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateRideStatus(req, res) {
  try {
    return transitionRide(req, res, req.body.status);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }
}

async function transitionRide(req, res, nextStatus) {
  try {
    if (!["arrived", "in_progress", "completed"].includes(nextStatus)) {
      throw createHttpError("Invalid driver ride status", 400);
    }

    const rideId = await runWithTransaction(async (session) => {
      const ride = await queryWithSession(
        Ride.findById(req.params.id),
        session,
      );
      if (!ride) throw createHttpError("Ride not found", 404);
      if (ride.driverId?.toString() !== req.user.id) {
        throw createHttpError(
          "Only the assigned driver can update this ride",
          403,
        );
      }

      applyTransition(ride, nextStatus);
      await ride.save(session ? { session } : undefined);

      if (nextStatus === "completed") {
        await queryWithSession(
          DriverProfile.updateOne(
            { userId: ride.driverId, activeRideId: ride._id },
            { $set: { activeRideId: null, isAvailable: true } },
          ),
          session,
        );
      }
      return ride._id;
    });

    const ride = await Ride.findById(rideId);
    notifyRideStatusChanged({ ride });
    const statusLabel = nextStatus
      .split("_")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
    return sendSuccess(res, `Ride Marked ${statusLabel}`, {
      ride: await presentRide(ride),
    });
  } catch (err) {
    return sendError(
      res,
      err.status >= 500 ? "Could not update ride" : err.message,
      err.status || (err.name === "CastError" ? 400 : 500),
    );
  }
}

async function cancelRide(req, res) {
  try {
    const nextStatus =
      req.user.role === "driver" ? "cancelled_by_driver" : "cancelled_by_rider";
    const rideId = await runWithTransaction(async (session) => {
      const ride = await queryWithSession(
        Ride.findById(req.params.id),
        session,
      );
      if (!ride) throw createHttpError("Ride not found", 404);

      const isRider = ride.riderId.toString() === req.user.id;
      const isDriver = ride.driverId?.toString() === req.user.id;
      if (!isRider && !isDriver)
        throw createHttpError("Not authorized to cancel this ride", 403);
      if (
        (req.user.role === "driver" && !isDriver) ||
        (req.user.role === "rider" && !isRider)
      ) {
        throw createHttpError("Not authorized to cancel this ride", 403);
      }

      applyTransition(ride, nextStatus);
      if (typeof req.body.reason === "string" && req.body.reason.trim()) {
        ride.cancellationReason = req.body.reason.trim();
      }
      await ride.save(session ? { session } : undefined);

      if (ride.driverId) {
        await queryWithSession(
          DriverProfile.updateOne(
            { userId: ride.driverId, activeRideId: ride._id },
            { $set: { activeRideId: null, isAvailable: true } },
          ),
          session,
        );
      }
      return ride._id;
    });

    const ride = await Ride.findById(rideId);
    notifyRideStatusChanged({ ride });
    return sendSuccess(res, "Ride cancelled", {
      ride: await presentRide(ride),
    });
  } catch (err) {
    return sendError(
      res,
      err.status >= 500 ? "Could not cancel ride" : err.message,
      err.status || (err.name === "CastError" ? 400 : 500),
    );
  }

}

async function getMyRideHistory(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );
    const requestedStatuses = String(req.query.status || "")
      .split(",")
      .map((status) => status.trim())
      .filter(Boolean);
    const validStatuses = new Set([
      ...ACTIVE_RIDE_STATUSES,
      "requested",
      ...TERMINAL_STATUSES,
    ]);
    if (requestedStatuses.some((status) => !validStatuses.has(status))) {
      return sendError(res, "One or more status filters are invalid", 400);
    }

    const filter =
      req.user.role === "driver"
        ? { driverId: req.user.id }
        : { riderId: req.user.id };
    filter.status = requestedStatuses.length
      ? { $in: requestedStatuses }
      : { $in: TERMINAL_STATUSES };
    const [rides, total] = await Promise.all([
      Ride.find(filter)
        .sort({ completedAt: -1, cancelledAt: -1, requestedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Ride.countDocuments(filter),
    ]);
    const presentedRides = await Promise.all(
      rides.map((ride) => presentRide(ride)),
    );
    return sendSuccess(res, "Ride history retrieved", {
      rides: presentedRides,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createRide,
  estimateRide,
  getRide,
  getAvailableRides,
  getCurrentRiderRide,
  acceptRide,
  updateRideStatus,
  transitionRide,
  cancelRide,
  getMyRideHistory,
};
