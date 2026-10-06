const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { createRating } = require("../controllers/rating.controller");

router.post("/", requireAuth, createRating);

module.exports = router;
