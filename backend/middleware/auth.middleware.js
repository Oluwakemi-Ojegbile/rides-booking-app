const { verifyToken } = require("../services/authService");
const { sendError } = require("../services/apiResponse");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return sendError(res, "Missing or malformed token", 401);
  }

  try {
    const token = header.split(" ")[1];
    const tokenUser = verifyToken(token);
    const user = await User.findById(tokenUser.id).select("role isActive").lean();
    if (!user || !user.isActive) return sendError(res, "This account is inactive", 403);
    req.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch {
    return sendError(res, "Invalid or expired token", 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, "Not authorized for this action", 403);
    }
    return next();
  };
}

const requireRider = requireRole("rider");
const requireDriver = requireRole("driver");
const requireAdmin = requireRole("admin");

module.exports = { requireAuth, requireRole, requireRider, requireDriver, requireAdmin };
