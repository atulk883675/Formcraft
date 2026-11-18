
const express = require("express");

const {
  register,
  login,
} = require("./auth.controller");

const {
  registerSchema,
  loginSchema,
} = require("./auth.validation");

const validateMiddleware = require("../../middlewares/validateMiddleware");

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

module.exports = router;
