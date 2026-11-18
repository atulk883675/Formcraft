
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

  // Use the same error for unknown email and incorrect password.
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

module.exports = {
  registerAdmin,
  loginAdmin,
};
