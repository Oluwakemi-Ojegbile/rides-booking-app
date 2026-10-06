const crypto = require("crypto");
const { Buffer } = require("buffer");

function createInvitationToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hashInvitationToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getEncryptionKey() {
  const secret = process.env.INVITATION_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error("INVITATION_ENCRYPTION_KEY or JWT_SECRET is required");
  return crypto.createHash("sha256").update(secret).digest();
}

function encryptInvitationToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

function decryptInvitationToken(ciphertext) {
  const [ivValue, authTagValue, encryptedValue] = ciphertext.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64url")), decipher.final()]).toString("utf8");
}

module.exports = { createInvitationToken, hashInvitationToken, encryptInvitationToken, decryptInvitationToken };
