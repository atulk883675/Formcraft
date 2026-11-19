
const express = require("express");

const healthRoutes = require("./healthRoutes");
const authRoutes = require("../modules/auth/auth.routes");
const adminRoutes = require("../modules/admin/admin.routes");
const formRoutes = require("../modules/forms/form.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/forms", formRoutes);

module.exports = router;
