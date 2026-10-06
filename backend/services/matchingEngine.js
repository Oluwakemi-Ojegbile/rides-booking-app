const DriverProfile = require("../models/DriverProfile");

async function findAvailableDrivers({ pickup, limit = 5 } = {}) {
  const drivers = await DriverProfile.find({
    isAvailable: true,
  })
    .populate("userId", "fullName phone email role")
    .limit(limit);

  return drivers.map((driver) => ({
    driver,
    distanceKm: pickup ? null : undefined,
  }));
}

module.exports = { findAvailableDrivers };
