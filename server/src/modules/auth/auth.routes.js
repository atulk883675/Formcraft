
const express = require("express");

const {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  logoutAll,
} = require("./auth.controller");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./auth.validation");

const validateMiddleware = require("../../middlewares/validateMiddleware");
const authMiddleware = require("../../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/register",
  validateMiddleware(registerSchema),
  register
);

router.post(
  "/login",
  validateMiddleware(loginSchema),
  login
);

router.post(
  "/refresh",
  refresh
);

router.post(
  "/forgot-password",
  validateMiddleware(forgotPasswordSchema),
  forgotPassword
);

router.post(
  "/reset-password",
  validateMiddleware(resetPasswordSchema),
  resetPassword
);

router.post(
  "/logout",
  authMiddleware,
  logout
);

router.post(
  "/logout-all",
  authMiddleware,
  logoutAll
);

module.exports = router;
