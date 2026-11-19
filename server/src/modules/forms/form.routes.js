
const express = require("express");

const {
  createForm,
  getAdminForms,
  getFormById,
  updateForm,
  deleteForm,
} = require("./form.controller");

const {
  createFormSchema,
  updateFormSchema,
} = require("./form.validation");

const authMiddleware = require("../../middlewares/authMiddleware");
const validateMiddleware = require("../../middlewares/validateMiddleware");

const router = express.Router();

// All form routes require authentication
router.use(authMiddleware);

// Create a blank form
router.post(
  "/",
  validateMiddleware(createFormSchema),
  createForm
);

// Get all forms belonging to the logged-in Admin
router.get("/", getAdminForms);

// Get one form
router.get("/:formId", getFormById);

// Update a Draft form
router.patch(
  "/:formId",
  validateMiddleware(updateFormSchema),
  updateForm
);

// Delete a Draft form
router.delete("/:formId", deleteForm);

module.exports = router;
