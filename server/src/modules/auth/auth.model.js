
const mongoose = require("mongoose");

const refreshTokenHistorySchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
    },
    usedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const refreshSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
    },
    tokenHistory: {
      type: [refreshTokenHistorySchema],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokeReason: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
    profilePicture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UploadMetadata",
      default: null,
    },
    refreshSessions: {
      type: [refreshSessionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.index({ email: 1 }, { unique: true });

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
