const Rating = require("../models/Rating");
const Ride = require("../models/Ride");
const mongoose = require("mongoose");
const { sendError, sendSuccess } = require("../services/apiResponse");

async function createRating(req, res) {
  try {
    const { rideId, to, score, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(rideId) || !mongoose.Types.ObjectId.isValid(to)) {
      return sendError(res, "Invalid ride or user identifier", 400);
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) return sendError(res, "Score must be between 1 and 5", 400);
    const ride = await Ride.findById(rideId);
    if (!ride) return sendError(res, "Ride not found", 404);
    if (ride.status !== "completed") {
      return sendError(res, "Ratings can only be added after a completed ride", 400);
    }
    const isRider = ride.riderId.toString() === req.user.id;
    const isDriver = ride.driverId?.toString() === req.user.id;
    if (!isRider && !isDriver) return sendError(res, "Not authorized to rate this ride", 403);
    const expectedRecipient = isRider ? ride.driverId?.toString() : ride.riderId.toString();
    if (!expectedRecipient || expectedRecipient !== to) return sendError(res, "Ratings must be sent to the other ride participant", 400);

    const rating = await Rating.create({
      ride: rideId,
      from: req.user.id,
      to,
      score,
      comment,
    });

    return sendSuccess(res, "Rating submitted", { rating }, 201);
  } catch (err) {
    if (err.code === 11000) return sendError(res, "You have already rated this ride", 409);
    return sendError(res, "Could not submit rating", 500);
  }
}

module.exports = { createRating };
