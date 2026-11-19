
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const errorMiddleware = require("./middlewares/errorMiddleware");
const notFoundMiddleware = require("./middlewares/notFoundMiddleware");
const env = require("./config/env");
const apiRoutes = require("./routes");
const cookieParser = require("cookie-parser");

const app = express();

// Security headers
app.use(helmet());

// Allow requests from the React frontend
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json({ limit: "1mb" }));

app.use(cookieParser());

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

// Login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
});

// Forgot-password rate limiter
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset requests. Please try again later.",
  },
});

// Reset-password rate limiter
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password-reset attempts. Please try again later.",
  },
});

// Apply general API protection
app.use("/api", apiLimiter);

// Apply stricter authentication protection
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/forgot-password", forgotPasswordLimiter);
app.use("/api/auth/reset-password", resetPasswordLimiter);

// Mount API routes
app.use("/api", apiRoutes);

// Handle unknown API routes
app.use("/api", notFoundMiddleware);

// Centralized error handler (must remain last)
app.use(errorMiddleware);

module.exports = app;
