const express = require("express");

const {
  getProfile,
  updateProfile,
  changePassword,
} = require("./admin.controller");

const {
  updateProfileSchema,
  changePasswordSchema,
} = require("./admin.validation");

const authMiddleware = require("../../middlewares/authMiddleware");
const validateMiddleware = require("../../middlewares/validateMiddleware");

const router = express.Router();

// All Admin profile routes require authentication.
router.use(authMiddleware);

// GET /api/admin/profile
router.get("/profile", getProfile);

// PATCH /api/admin/profile
router.patch(
  "/profile",
  validateMiddleware(updateProfileSchema),
  updateProfile
);

// PATCH /api/admin/change-password
router.patch(
  "/change-password",
  validateMiddleware(changePasswordSchema),
  changePassword
);

module.exports = router;
