const mongoose = require("mongoose");

const driverProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    vehicleMake: { type: String, required: true, trim: true },
    vehicleModel: { type: String, required: true, trim: true },
    vehicleColor: { type: String, required: true, trim: true },
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    isAvailable: { type: Boolean, default: false, index: true },
    activeRideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null },
    currentLocation: {
      latitude: Number,
      longitude: Number,
    },
  },
  { timestamps: true }
);

driverProfileSchema.index({ isAvailable: 1, activeRideId: 1 });

module.exports = mongoose.model("DriverProfile", driverProfileSchema);
