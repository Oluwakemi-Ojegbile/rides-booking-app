const mongoose = require("mongoose");

async function clearTestDatabase() {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Database cleanup is allowed only when NODE_ENV=test");
  }
  const databaseName = mongoose.connection.name || "";
  if (!databaseName.includes("test")) {
    throw new Error("Refusing to clean a database without 'test' in its name");
  }
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})));
}

module.exports = { clearTestDatabase };
