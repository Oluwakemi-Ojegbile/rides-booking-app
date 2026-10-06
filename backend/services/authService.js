const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

async function comparePassword(plainPassword, passwordHash) {
  return bcrypt.compare(plainPassword, passwordHash);
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken };
