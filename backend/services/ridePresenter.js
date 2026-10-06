const DriverProfile = require("../models/DriverProfile");
const Ride = require("../models/Ride");

async function presentRide(ride) {
  const populatedRide = await Ride.findById(ride._id)
    .populate({ path: "riderId", select: "fullName phone" })
    .populate({ path: "driverId", select: "fullName phone" });

  if (!populatedRide) return null;

  const result = populatedRide.toObject();
  if (populatedRide.driverId) {
    result.driverProfile = await DriverProfile.findOne({ userId: populatedRide.driverId._id })
      .select("vehicleMake vehicleModel vehicleColor plateNumber")
      .lean();
  }

  return result;
}

module.exports = { presentRide };