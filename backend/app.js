require("dotenv").config();

const { createApp } = require("./config/app");
const { connectDatabase, closeDatabase } = require("./config/database");

const PORT = process.env.PORT || 5000;

function validateEnvironment() {
  const required = ["MONGO_URI", "JWT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length)
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
    throw new Error("CLIENT_URL is required in production");
  }
}

const startServer = async () => {
  try {
    validateEnvironment();
    await connectDatabase();

    const server = createApp().listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", async (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
        console.error(
          `Stop the process using port ${PORT} or set PORT to another value in backend/.env.`,
        );
      } else {
        console.error("Server error:", error.message);
      }

      await closeDatabase("server startup failure");
      process.exit(1);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down gracefully.`);
      server.close(async () => {
        await closeDatabase(signal);
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Unable to start the application");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();
