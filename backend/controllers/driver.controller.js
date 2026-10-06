const DriverProfile = require("../models/DriverProfile");
const Ride = require("../models/Ride");
const { sendError, sendSuccess } = require("../services/apiResponse");
const { presentRide } = require("../services/ridePresenter");

const ACTIVE_RIDE_STATUSES = ["accepted", "arrived", "in_progress"];
const VEHICLE_FIELDS = ["vehicleMake", "vehicleModel", "vehicleColor", "plateNumber"];

async function getProfile(req, res, next) {
  try {
    const profile = await DriverProfile.findOne({ userId: req.user.id })
      .select("-activeRideId")
      .populate({ path: "userId", select: "fullName email phone" });

    if (!profile) return sendError(res, "Driver profile not found", 404);
    return sendSuccess(res, "Driver profile retrieved", { profile });
  } catch (error) {
    return next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const updates = {};
    VEHICLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
          const error = new Error(`${field} must be a non-empty string`);
          error.status = 400;
          throw error;
        }
        updates[field] = req.body[field].trim();
      }
    });

    if (!Object.keys(updates).length) {
      return sendError(res, "Provide at least one vehicle field to update", 400);
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-activeRideId");

    if (!profile) return sendError(res, "Driver profile not found", 404);
    return sendSuccess(res, "Driver profile updated", { profile });
  } catch (error) {
    return next(error);
  }
}

async function updateAvailability(req, res, next) {
  try {
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      return sendError(res, "isAvailable must be a boolean", 400);
    }

    const profile = await DriverProfile.findOne({ userId: req.user.id });
    if (!profile) return sendError(res, "Driver profile not found", 404);

    if (isAvailable && VEHICLE_FIELDS.some((field) => !profile[field]?.trim())) {
      return sendError(res, "Complete all vehicle information before going online", 400);
    }

    const activeRide = await Ride.findOne({
      driverId: req.user.id,
      status: { $in: ACTIVE_RIDE_STATUSES },
    }).select("_id");
    if (profile.activeRideId || activeRide) {
      return sendError(res, "Availability cannot be changed while a ride is active", 409);
    }

    const updatedProfile = await DriverProfile.findOneAndUpdate(
      { _id: profile._id, activeRideId: null },
      { $set: { isAvailable } },
      { new: true }
    );
    if (!updatedProfile) {
      return sendError(res, "Availability cannot be changed while a ride is active", 409);
    }

    return sendSuccess(res, "Driver availability updated", { isAvailable: updatedProfile.isAvailable });
  } catch (error) {
    return next(error);
  }
}

async function updateLocation(req, res, next) {
  try {
    const { latitude, longitude } = req.body;
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return sendError(res, "A valid latitude and longitude are required", 400);
    }

    const profile = await DriverProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { currentLocation: { latitude, longitude } } },
      { new: true, runValidators: true }
    ).select("currentLocation");

    if (!profile) return sendError(res, "Driver profile not found", 404);
    return sendSuccess(res, "Driver location updated", { currentLocation: profile.currentLocation });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentRide(req, res, next) {
  try {
    const ride = await Ride.findOne({
      driverId: req.user.id,
      status: { $in: ACTIVE_RIDE_STATUSES },
    }).sort({ acceptedAt: -1 });

    return sendSuccess(res, "Current ride retrieved", {
      ride: ride ? await presentRide(ride) : null,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getProfile, updateProfile, updateAvailability, updateLocation, getCurrentRide };