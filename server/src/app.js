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

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use("/api", apiRoutes);

// Handle unknown API routes
app.use("/api", notFoundMiddleware);

// Centralized error handler (must remain last)
app.use(errorMiddleware);

module.exports = app;