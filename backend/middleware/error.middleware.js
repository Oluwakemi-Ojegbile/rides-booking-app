const { sendError } = require("../services/apiResponse");

function notFoundHandler(req, res) {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.code === 11000) {
    if (error?.keyPattern?.riderId) {
      return sendError(res, "You already have an active ride", 409);
    }
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || "field";
    return sendError(res, `${field} already exists`, 409);
  }

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map((item) => item.message).join(", ");
    return sendError(res, message || "Validation failed", 400);
  }

  const statusCode = error.status || 500;
  const message = statusCode >= 500 ? "Internal server error" : error.message;
  return sendError(res, message, statusCode);
}

module.exports = { notFoundHandler, errorHandler };
