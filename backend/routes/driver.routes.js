const express = require("express");
const { requireAuth, requireDriver } = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  updateAvailability,
  updateLocation,
  getCurrentRide,
} = require("../controllers/driver.controller");
const { getMyRideHistory } = require("../controllers/ride.controller");

const router = express.Router();

router.use(requireAuth, requireDriver);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/availability", updateAvailability);
router.patch("/location", updateLocation);
router.get("/rides/current", getCurrentRide);
router.get("/rides/history", getMyRideHistory);

module.exports = router;
