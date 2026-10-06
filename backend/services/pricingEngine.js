function getPricing() {
  return {
    baseFare: Number(process.env.BASE_FARE || 1000),
    ratePerKm: Number(process.env.RATE_PER_KM || 500),
  };
}

function calculateFareEstimate({ distanceKm = 0 } = {}) {
  const { baseFare, ratePerKm } = getPricing();
  const fareEstimate = Math.round(baseFare + distanceKm * ratePerKm);

  return {
    fareEstimate,
    currency: "NGN",
    breakdown: {
      baseFare,
      distance: distanceKm * ratePerKm,
    },
  };
}

function calculateDistanceKm(pickup, destination) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(destination.latitude - pickup.latitude);
  const longitudeDelta = radians(destination.longitude - pickup.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(pickup.latitude)) * Math.cos(radians(destination.latitude)) *
    Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { calculateFareEstimate, calculateDistanceKm };
