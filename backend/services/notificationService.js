function notifyRideRequested({ ride, drivers = [] }) {
  return {
    rideId: ride._id,
    recipientCount: drivers.length,
    channel: "in_app",
  };
}

function notifyRideStatusChanged({ ride }) {
  return {
    rideId: ride._id,
    status: ride.status,
    channel: "in_app",
  };
}

module.exports = { notifyRideRequested, notifyRideStatusChanged };
