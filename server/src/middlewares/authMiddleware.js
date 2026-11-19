const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const Admin = require("../modules/auth/auth.model");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const accessToken = authHeader.slice(7).trim();

  if (!accessToken) {
    return next(new ApiError(401, "Authentication required"));
  }

  let decoded;

  try {
    decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired access token"));
  }

  if (
    typeof decoded.sub !== "string" ||
    typeof decoded.sessionId !== "string" ||
    !mongoose.Types.ObjectId.isValid(decoded.sub)
  ) {
    return next(new ApiError(401, "Invalid access token"));
  }

  const admin = await Admin.findOne({
    _id: decoded.sub,
    refreshSessions: {
      $elemMatch: {
        sessionId: decoded.sessionId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
    },
  }).select("_id");

  if (!admin) {
    return next(new ApiError(401, "Session is invalid or expired"));
  }

  req.auth = {
    adminId: admin._id.toString(),
    sessionId: decoded.sessionId,
  };

  next();
};

module.exports = authMiddleware;
