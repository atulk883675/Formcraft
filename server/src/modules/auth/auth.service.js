
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const Admin = require("./auth.model");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const {
  hashPassword,
  comparePassword,
} = require("../../utils/password");

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_SESSION_DAYS = 7;
const PASSWORD_RESET_TOKEN_MINUTES = 30;

// Generate an access JWT.
const generateAccessToken = (adminId, sessionId) => {
  return jwt.sign(
    {
      sub: adminId,
      sessionId,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate a secure refresh token.
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

// Hash the refresh token before storing it.
const hashRefreshToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Create a new independent refresh session.
const createRefreshSession = () => {
  const refreshToken = generateRefreshToken();
  const sessionId = crypto.randomUUID();

  const expiresAt = new Date(
    Date.now() + REFRESH_SESSION_DAYS * 24 * 60 * 60 * 1000
  );

  return {
    refreshToken,
    session: {
      sessionId,
      tokenHash: hashRefreshToken(refreshToken),
      tokenHistory: [],
      expiresAt,
      lastUsedAt: new Date(),
    },
  };
};

// Register a new Admin and automatically create a session.
const registerAdmin = async ({ name, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingAdmin = await Admin.findOne({
    email: normalizedEmail,
  });

  if (existingAdmin) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const { refreshToken, session } = createRefreshSession();

  try {
    const admin = await Admin.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      refreshSessions: [session],
    });

    const accessToken = generateAccessToken(
      admin._id.toString(),
      session.sessionId
    );

    return {
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        isEmailVerified: admin.isEmailVerified,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "An account with this email already exists"
      );
    }

    throw error;
  }
};

// Log in an existing Admin and create a new session.
const loginAdmin = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const admin = await Admin.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordCorrect = await comparePassword(
    password,
    admin.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid email or password");
  }

  const { refreshToken, session } = createRefreshSession();

  admin.refreshSessions.push(session);
  await admin.save();

  const accessToken = generateAccessToken(
    admin._id.toString(),
    session.sessionId
  );

  return {
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      isEmailVerified: admin.isEmailVerified,
    },
    accessToken,
    refreshToken,
  };
};

// Refresh an Admin session and rotate its refresh token.
const refreshAdminSession = async (presentedToken) => {
  if (
    typeof presentedToken !== "string" ||
    presentedToken.length !== 128
  ) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const now = new Date();
  const oldTokenHash = hashRefreshToken(presentedToken);

  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);

  const newExpiry = new Date(
    now.getTime() + REFRESH_SESSION_DAYS * 24 * 60 * 60 * 1000
  );

  // Atomically replace the current token only if it is still valid.
  const updatedAdmin = await Admin.findOneAndUpdate(
    {
      refreshSessions: {
        $elemMatch: {
          tokenHash: oldTokenHash,
          revokedAt: null,
          expiresAt: { $gt: now },
        },
      },
    },
    {
      $push: {
        "refreshSessions.$[session].tokenHistory": {
          tokenHash: oldTokenHash,
          usedAt: now,
        },
      },
      $set: {
        "refreshSessions.$[session].tokenHash": newTokenHash,
        "refreshSessions.$[session].lastUsedAt": now,
        "refreshSessions.$[session].expiresAt": newExpiry,
      },
    },
    {
      arrayFilters: [
        {
          "session.tokenHash": oldTokenHash,
          "session.revokedAt": null,
          "session.expiresAt": { $gt: now },
        },
      ],
      new: true,
      runValidators: true,
    }
  );

  if (!updatedAdmin) {
    // An old, reused, invalid, or expired token is simply rejected.
    // Other active sessions belonging to this Admin are not affected.
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const matchingSession = updatedAdmin.refreshSessions.find(
    (session) => session.tokenHash === newTokenHash
  );

  const accessToken = generateAccessToken(
    updatedAdmin._id.toString(),
    matchingSession.sessionId
  );

  return {
    admin: {
      id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      isEmailVerified: updatedAdmin.isEmailVerified,
    },
    accessToken,
    refreshToken: newRefreshToken,
  };
};

// Request a password-reset token.
const requestPasswordReset = async ({ email }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const admin = await Admin.findOne({
    email: normalizedEmail,
  }).select("_id");

  // Return null for unknown accounts.
  // The controller must respond with the same generic message either way.
  if (!admin) {
    return null;
  }

  // Generate a cryptographically secure, 32-byte token.
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Store only its SHA-256 hash.
  const resetTokenHash = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const resetTokenExpiresAt = new Date(
    Date.now() + PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000
  );

  await Admin.updateOne(
    { _id: admin._id },
    {
      $set: {
        passwordResetTokenHash: resetTokenHash,
        passwordResetExpiresAt: resetTokenExpiresAt,
      },
    }
  );

  // Internal use only: the future email-delivery adapter must never
  // expose this token in an API response.
  return {
    resetToken,
  };
};

// Reset an Admin password using a valid, unexpired, one-time token.
const resetAdminPassword = async ({ token, newPassword }) => {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    throw new ApiError(400, "Invalid or expired password-reset token");
  }

  const resetTokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const now = new Date();
  const hashedPassword = await hashPassword(newPassword);

  // Consume the token and revoke active sessions in one database update.
  // The token hash and expiry conditions prevent reuse and expired-token use.
  const result = await Admin.updateOne(
    {
      passwordResetTokenHash: resetTokenHash,
      passwordResetExpiresAt: { $gt: now },
    },
    {
      $set: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        "refreshSessions.$[session].revokedAt": now,
        "refreshSessions.$[session].revokeReason": "password_reset",
      },
    },
    {
      arrayFilters: [
        {
          "session.revokedAt": null,
          "session.expiresAt": { $gt: now },
        },
      ],
    }
  );

  if (result.matchedCount !== 1) {
    throw new ApiError(400, "Invalid or expired password-reset token");
  }

  return true;
};

// Log out from the current session.
const logoutAdminSession = async (adminId, sessionId) => {
  const now = new Date();

  const result = await Admin.updateOne(
    {
      _id: adminId,
      refreshSessions: {
        $elemMatch: {
          sessionId,
          revokedAt: null,
          expiresAt: { $gt: now },
        },
      },
    },
    {
      $set: {
        "refreshSessions.$[session].revokedAt": now,
        "refreshSessions.$[session].revokeReason": "user_logout",
      },
    },
    {
      arrayFilters: [
        {
          "session.sessionId": sessionId,
          "session.revokedAt": null,
          "session.expiresAt": { $gt: now },
        },
      ],
    }
  );

  if (result.modifiedCount !== 1) {
    throw new ApiError(401, "Session is already invalid");
  }
};

// Log out an Admin from all active devices.
const logoutAllAdminSessions = async (adminId) => {
  const now = new Date();

  const result = await Admin.updateOne(
    {
      _id: adminId,
      refreshSessions: {
        $elemMatch: {
          revokedAt: null,
          expiresAt: { $gt: now },
        },
      },
    },
    {
      $set: {
        "refreshSessions.$[session].revokedAt": now,
        "refreshSessions.$[session].revokeReason": "logout_all",
      },
    },
    {
      arrayFilters: [
        {
          "session.revokedAt": null,
          "session.expiresAt": { $gt: now },
        },
      ],
    }
  );

  return result.modifiedCount;
};

module.exports = {
  registerAdmin,
  loginAdmin,
  refreshAdminSession,
  requestPasswordReset,
  resetAdminPassword,
  logoutAdminSession,
  logoutAllAdminSessions,
};
