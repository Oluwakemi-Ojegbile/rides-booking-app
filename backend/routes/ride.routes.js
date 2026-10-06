const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth.middleware");
const asyncHandler = require("../services/asyncHandler");
const {
  createRide,
  estimateRide,
  getRide,
  getAvailableRides,
  getCurrentRiderRide,
  acceptRide,
  updateRideStatus,
  transitionRide,
  cancelRide,
  getMyRideHistory,
} = require("../controllers/ride.controller");

router.post("/estimate",requireAuth,requireRole("rider"),asyncHandler(estimateRide));

router.post("/",requireAuth,requireRole("rider"),asyncHandler(createRide));

router.get("/current",requireAuth,requireRole("rider"),asyncHandler(getCurrentRiderRide));

router.get("/available",requireAuth,requireRole("driver"),asyncHandler(getAvailableRides));

router.get("/history", requireAuth, getMyRideHistory);
router.get("/history/mine", requireAuth, getMyRideHistory);

router.get("/:id", requireAuth, asyncHandler(getRide));

router.patch("/:id/accept", requireAuth, requireRole("driver"), asyncHandler(acceptRide));

router.patch("/:id/arrive", requireAuth, requireRole("driver"), (req, res) => transitionRide(req, res, "arrived"));
router.patch("/:id/start", requireAuth, requireRole("driver"), (req, res) => transitionRide(req, res, "in_progress"));
router.patch("/:id/complete", requireAuth, requireRole("driver"), (req, res) => transitionRide(req, res, "completed"));

router.patch("/:id/status", requireAuth, requireRole("driver"), updateRideStatus);

router.patch("/:id/cancel", requireAuth, asyncHandler(cancelRide));

module.exports = router;
