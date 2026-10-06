const VALID_TRANSITIONS = {
  requested: ["accepted", "cancelled_by_rider"],
  accepted: ["arrived", "cancelled_by_rider", "cancelled_by_driver"],
  arrived: ["in_progress", "cancelled_by_rider", "cancelled_by_driver"],
  in_progress: ["completed"],
  completed: [],
  cancelled_by_rider: [],
  cancelled_by_driver: [],
};

class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Cannot transition ride from "${from}" to "${to}"`);
    this.name = "InvalidTransitionError";
  }
}

function assertValidTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new InvalidTransitionError(currentStatus, nextStatus);
  }
}

function applyTransition(ride, nextStatus) {
  assertValidTransition(ride.status, nextStatus);

  ride.status = nextStatus;

  const timestampField = {
    accepted: "acceptedAt",
    arrived: "arrivedAt",
    in_progress: "startedAt",
    completed: "completedAt",
    cancelled_by_rider: "cancelledAt",
    cancelled_by_driver: "cancelledAt",
  }[nextStatus];

  if (timestampField) {
    ride[timestampField] = new Date();
  }

  return ride;
}

module.exports = {
  VALID_TRANSITIONS,
  InvalidTransitionError,
  assertValidTransition,
  applyTransition,
};
