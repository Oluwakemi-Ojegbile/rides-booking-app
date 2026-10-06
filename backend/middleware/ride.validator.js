function hasLocation(location) {
  return Boolean(location && location.address);
}

function validateRideRequest(payload) {
  const errors = [];
  if (!hasLocation(payload.pickup)) errors.push("pickup is required");
  if (!hasLocation(payload.dropoff)) errors.push("dropoff is required");
  return errors;
}

module.exports = { validateRideRequest };
