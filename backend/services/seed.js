require("dotenv").config();

const User = require("../models/User");
const DriverProfile = require("../models/DriverProfile");
const { connectDatabase, closeDatabase } = require("../config/database");
const { hashPassword } = require("./authService");

const rider = {
  fullName: "Development Rider",
  email: "rider.dev@example.com",
  phone: "+15550000001",
  password: "DevPassword123!",
  role: "rider",
};

const driver = {
  fullName: "Development Driver",
  email: "driver.dev@example.com",
  phone: "+15550000002",
  password: "DevPassword123!",
  role: "driver",
};

const admin = {
  fullName: "Development Administrator",
  email: "admin.dev@example.com",
  phone: "+15550000003",
  password: "Oluwakemi@2",
  role: "admin",
};

async function upsertUser(seedUser) {
  const existing = await User.findOne({ email: seedUser.email });
  if (existing) return existing;

  return User.create({
    ...seedUser,
    password: await hashPassword(seedUser.password),
  });
}

async function seed() {
  await connectDatabase();

  const riderUser = await upsertUser(rider);
  const driverUser = await upsertUser(driver);
  const adminUser = await upsertUser(admin);

  await DriverProfile.updateOne(
    { userId: driverUser._id },
    {
      $setOnInsert: {
        userId: driverUser._id,
        vehicleMake: "Toyota",
        vehicleModel: "Corolla",
        vehicleColor: "Silver",
        plateNumber: "DEV-1234",
        isAvailable: true,
        currentLocation: {
          latitude: 6.5244,
          longitude: 3.3792,
        },
      },
    },
    { upsert: true },
  );

  console.log("Development-only seed completed.");
  console.log("Rider: rider.dev@example.com / DevPassword123!");
  console.log("Driver: driver.dev@example.com / DevPassword123!");
  console.log("Admin: admin.dev@example.com / DevPassword123!");
  console.log(
    `Seeded user ids: ${riderUser._id}, ${driverUser._id}, ${adminUser._id}`,
  );

  await closeDatabase("seed completion");
}

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await closeDatabase("seed failure");
  process.exit(1);
});
