const mongoose = require("mongoose");
const User = require("../models/User");
const Ride = require("../models/Ride");
const DriverProfile = require("../models/DriverProfile");
const AdminInvitation = require("../models/AdminInvitation");
const { sendError, sendSuccess } = require("../services/apiResponse");
const { presentRide } = require("../services/ridePresenter");
const { createInvitationToken, hashInvitationToken, encryptInvitationToken, decryptInvitationToken } = require("../services/adminInvitationService");

const RIDE_STATUSES = ["requested", "accepted", "arrived", "in_progress", "completed", "cancelled_by_rider", "cancelled_by_driver"];

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

async function getOverview(req, res, next) {
  try {
    const [users, riders, drivers, activeDrivers, activeRides, completedRides, cancelledRides, recentRides] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "rider" }),
      User.countDocuments({ role: "driver" }),
      DriverProfile.countDocuments({ isAvailable: true }),
      Ride.countDocuments({ status: { $in: ["requested", "accepted", "arrived", "in_progress"] } }),
      Ride.countDocuments({ status: "completed" }),
      Ride.countDocuments({ status: { $in: ["cancelled_by_rider", "cancelled_by_driver"] } }),
      Ride.find().sort({ requestedAt: -1 }).limit(5),
    ]);
    return sendSuccess(res, "Administration overview retrieved", {
      metrics: { users, riders, drivers, activeDrivers, activeRides, completedRides, cancelledRides },
      recentRides: await Promise.all(recentRides.map((ride) => presentRide(ride))),
    });
  } catch (error) { return next(error); }
}

async function getUsers(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filter = {};
    if (["rider", "driver", "admin"].includes(req.query.role)) filter.role = req.query.role;
    if (req.query.active === "true" || req.query.active === "false") filter.isActive = req.query.active === "true";
    const [users, total] = await Promise.all([
      User.find(filter).select("fullName email phone role isActive createdAt").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);
    return sendSuccess(res, "Users retrieved", { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
}

async function updateUserStatus(req, res, next) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return sendError(res, "Invalid user identifier", 400);
    if (typeof req.body.isActive !== "boolean") return sendError(res, "isActive must be a boolean", 400);
    if (req.params.id === req.user.id) return sendError(res, "Administrators cannot deactivate their own account", 400);
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { isActive: req.body.isActive } }, { new: true, runValidators: true })
      .select("fullName email phone role isActive createdAt");
    if (!user) return sendError(res, "User not found", 404);
    if (user.role === "driver" && !user.isActive) {
      await DriverProfile.updateOne({ userId: user._id }, { $set: { isAvailable: false } });
    }
    return sendSuccess(res, `User ${user.isActive ? "activated" : "deactivated"}`, { user });
  } catch (error) { return next(error); }
}

async function createAdminInvitation(req, res, next) {
  try {
    const email = req.body.email.toLowerCase();
    const [existingUser, existingInvitation] = await Promise.all([
      User.findOne({ email }).lean(),
      AdminInvitation.findOne({ email, acceptedAt: null, expiresAt: { $gt: new Date() } })
        .select("+tokenHash +tokenCiphertext"),
    ]);
    if (existingUser) return sendError(res, "An account already exists for this email", 409);

    const token = createInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = existingInvitation || new AdminInvitation({ email, invitedBy: req.user.id });
    invitation.tokenHash = hashInvitationToken(token);
    invitation.tokenCiphertext = encryptInvitationToken(token);
    invitation.expiresAt = expiresAt;
    await invitation.save();
    return sendSuccess(res, existingInvitation ? "Administrator invitation regenerated" : "Administrator invitation created", {
      _id: invitation._id,
      token,
      email,
      expiresAt,
      status: "active",
    }, existingInvitation ? 200 : 201);
  } catch (error) { return next(error); }
}

async function getActiveAdminInvitations(req, res, next) {
  try {
    const invitations = await AdminInvitation.find({
      $or: [
        { acceptedAt: { $ne: null } },
        { acceptedAt: null, expiresAt: { $gt: new Date() } },
      ],
    })
      .select("+tokenHash +tokenCiphertext email expiresAt createdAt acceptedAt")
      .sort({ createdAt: -1 });
    const presentedInvitations = await Promise.all(invitations.map(async (invitation) => {
      if (invitation.acceptedAt) {
        return {
          _id: invitation._id,
          email: invitation.email,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
          acceptedAt: invitation.acceptedAt,
          status: "used",
        };
      }
      let token;
      try {
        token = decryptInvitationToken(invitation.tokenCiphertext);
      } catch {
        token = createInvitationToken();
        invitation.tokenHash = hashInvitationToken(token);
        invitation.tokenCiphertext = encryptInvitationToken(token);
        await invitation.save();
      }
      return {
        _id: invitation._id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
        token,
        status: "active",
      };
    }));
    return sendSuccess(res, "Active administrator invitations retrieved", {
      invitations: presentedInvitations,
    });
  } catch (error) { return next(error); }
}

async function getRides(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filter = {};
    if (RIDE_STATUSES.includes(req.query.status)) filter.status = req.query.status;
    const [rides, total] = await Promise.all([
      Ride.find(filter).sort({ requestedAt: -1 }).skip(skip).limit(limit),
      Ride.countDocuments(filter),
    ]);
    return sendSuccess(res, "Rides retrieved", {
      rides: await Promise.all(rides.map((ride) => presentRide(ride))),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) { return next(error); }
}

module.exports = { getOverview, getUsers, updateUserStatus, createAdminInvitation, getActiveAdminInvitations, getRides };
