const express = require("express");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const { getOverview, getUsers, updateUserStatus, createAdminInvitation, getActiveAdminInvitations, getRides } = require("../controllers/admin.controller");
const { createAdminInvitationRules } = require("../middleware/auth.validator");

const router = express.Router();
router.use(requireAuth, requireAdmin);
router.get("/overview", getOverview);
router.get("/users", getUsers);
router.patch("/users/:id/status", updateUserStatus);
router.post("/invitations", createAdminInvitationRules, createAdminInvitation);
router.get("/invitations", getActiveAdminInvitations);
router.get("/rides", getRides);

module.exports = router;
