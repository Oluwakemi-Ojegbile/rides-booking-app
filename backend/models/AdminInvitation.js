const mongoose = require("mongoose");

const adminInvitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    tokenCiphertext: {
      type: String,
      required: true,
      select: false,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    acceptedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("AdminInvitation", adminInvitationSchema);
