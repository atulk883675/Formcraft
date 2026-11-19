
const formService = require("./form.service");
const ApiResponse = require("../../utils/ApiResponse");

// Create a new form
const createForm = async (req, res, next) => {
  try {
    const form = await formService.createForm(
      req.auth.adminId,
      req.body
    );

    return res.status(201).json(
      new ApiResponse(201, form, "Form created successfully")
    );
  } catch (error) {
    next(error);
  }
};

// Get all forms belonging to the logged-in Admin
const getAdminForms = async (req, res, next) => {
  try {
    const forms = await formService.getAdminForms(req.auth.adminId);

    return res.status(200).json(
      new ApiResponse(200, forms, "Forms retrieved successfully")
    );
  } catch (error) {
    next(error);
  }
};

// Get a single form
const getFormById = async (req, res, next) => {
  try {
    const form = await formService.getFormById(
      req.auth.adminId,
      req.params.formId
    );

    return res.status(200).json(
      new ApiResponse(200, form, "Form retrieved successfully")
    );
  } catch (error) {
    next(error);
  }
};

// Update a Draft form
const updateForm = async (req, res, next) => {
  try {
    const form = await formService.updateForm(
      req.auth.adminId,
      req.params.formId,
      req.body
    );

    return res.status(200).json(
      new ApiResponse(200, form, "Form updated successfully")
    );
  } catch (error) {
    next(error);
  }
};

// Delete a Draft form
const deleteForm = async (req, res, next) => {
  try {
    await formService.deleteForm(
      req.auth.adminId,
      req.params.formId
    );

    return res.status(200).json(
      new ApiResponse(200, null, "Form deleted successfully")
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createForm,
  getAdminForms,
  getFormById,
  updateForm,
  deleteForm,
};
