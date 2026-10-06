const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    pickup: { type: locationSchema, required: true },
    destination: { type: locationSchema, required: true },
    distanceInKm: { type: Number, required: true, min: 0 },
    estimatedFare: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "arrived",
        "in_progress",
        "completed",
        "cancelled_by_rider",
        "cancelled_by_driver",
      ],
      default: "requested",
      index: true,
    },
    requestedAt: { type: Date, default: Date.now, index: true },
    acceptedAt: Date,
    arrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: { type: String, trim: true },
  },
  { timestamps: true }
);

rideSchema.index({ riderId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index(
  { riderId: 1 },
  {
    unique: true,
    name: "one_active_ride_per_rider",
    partialFilterExpression: {
      status: { $in: ["requested", "accepted", "arrived", "in_progress"] },
    },
  }
);

rideSchema.index({ status: 1, driverId: 1, requestedAt: 1 });

module.exports = mongoose.model("Ride", rideSchema);
