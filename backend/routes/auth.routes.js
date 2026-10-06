const express = require("express");
const { requireAuth } = require("../middleware/auth.middleware");
const { register, login, acceptAdminInvitation, getMe, logout } = require("../controllers/auth.controller");
const { registerRules, loginRules, acceptAdminInvitationRules } = require("../middleware/auth.validator");

const router = express.Router();

router.post("/register", registerRules, register);
router.post("/signup", registerRules, register);
router.post("/login", loginRules, login);
router.post("/admin-invitations/accept", acceptAdminInvitationRules, acceptAdminInvitation);
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);

module.exports = router;
