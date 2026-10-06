const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateFareEstimate } = require("../../services/pricingEngine");
const { assertValidTransition } = require("../../services/rideStateMachine");

test("fare estimate includes the configured base fare and distance", () => {
  const estimate = calculateFareEstimate({ distanceKm: 2, durationMinutes: 0 });
  assert.equal(estimate.currency, "NGN");
  assert.equal(estimate.fareEstimate, estimate.breakdown.baseFare + estimate.breakdown.distance);
});

test("only permitted ride lifecycle transitions are accepted", () => {
  assert.doesNotThrow(() => assertValidTransition("requested", "accepted"));
  assert.doesNotThrow(() => assertValidTransition("arrived", "in_progress"));
  assert.throws(() => assertValidTransition("requested", "cancelled_by_driver"));
  assert.throws(() => assertValidTransition("completed", "arrived"));
});
