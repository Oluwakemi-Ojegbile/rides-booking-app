const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected to ride_booking_app");
  });

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "ride_booking_app",
    serverSelectionTimeoutMS: 10000,
    family: 4,
  });
}

async function closeDatabase(signal = "process") {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
  console.log(`MongoDB connection closed after ${signal}`);
}

function getDatabaseStatus() {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  return states[mongoose.connection.readyState] || "unknown";
}

module.exports = { connectDatabase, closeDatabase, getDatabaseStatus };
