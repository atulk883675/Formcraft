
const express = require("express");

const {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  verifyEmail,
  logout,
  logoutAll,
  requestEmailChange,
  verifyEmailChange,
} = require("./auth.controller");

const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./auth.validation");

const { changeEmailSchema } = require("../admin/admin.validation");

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
  "/verify-email",
  verifyEmail
);

// Authenticated: request an email change
router.post(
  "/change-email",
  authMiddleware,
  validateMiddleware(changeEmailSchema),
  requestEmailChange
);

// Public: verify the new email address
router.post(
  "/verify-email-change",
  verifyEmailChange
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
