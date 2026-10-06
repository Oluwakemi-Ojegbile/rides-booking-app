const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("../routes/auth.routes");
const driverRoutes = require("../routes/driver.routes");
const rideRoutes = require("../routes/ride.routes");
const ratingRoutes = require("../routes/rating.routes");
const adminRoutes = require("../routes/admin.routes");
const { getDatabaseStatus } = require("./database");
const { sendSuccess } = require("../services/apiResponse");
const { notFoundHandler, errorHandler } = require("../middleware/error.middleware");

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return process.env.NODE_ENV === "production"
    ? configuredOrigins
    : [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
}

function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || getAllowedOrigins().includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "100kb" }));
  app.use(requestLogger);
  if (process.env.NODE_ENV !== "production") {
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
}

  app.get("/api/health", (req, res) => {
    return sendSuccess(res, "API is healthy", {
      status: "ok",
      database: getDatabaseStatus(),
      environment: process.env.NODE_ENV || "development",
    });
  });
  app.get("/health", (req, res) => res.redirect("/api/health"));

  app.use("/api/auth", authRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/ratings", ratingRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
