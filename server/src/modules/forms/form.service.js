
const mongoose = require("mongoose");
const Form = require("./form.model");
const ApiError = require("../../utils/ApiError");

const validateFormId = (formId) => {
  if (!mongoose.isValidObjectId(formId)) {
    throw new ApiError(400, "Invalid form ID");
  }
};

// Create a new blank form
const createForm = async (adminId, formData) => {
  const { title, description, category } = formData;

  const form = await Form.create({
    owner: adminId,
    title,
    description,
    category,
  });

  return form;
};

// Get all forms belonging to the logged-in Admin
const getAdminForms = async (adminId) => {
  const forms = await Form.find({ owner: adminId }).sort({
    updatedAt: -1,
  });

  return forms;
};

// Get one form, only if it belongs to the logged-in Admin
const getFormById = async (adminId, formId) => {
  validateFormId(formId);

  const form = await Form.findOne({
    _id: formId,
    owner: adminId,
  });

  if (!form) {
    throw new ApiError(404, "Form not found");
  }

  return form;
};

// Update a form only while it is a Draft
const updateForm = async (adminId, formId, formData) => {
  validateFormId(formId);

  const { title, description, category } = formData;

  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (category !== undefined) updates.category = category;

  const updatedForm = await Form.findOneAndUpdate(
    {
      _id: formId,
      owner: adminId,
      status: "Draft",
    },
    {
      $set: updates,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedForm) {
    const existingForm = await Form.exists({
      _id: formId,
      owner: adminId,
    });

    if (!existingForm) {
      throw new ApiError(404, "Form not found");
    }

    throw new ApiError(
      409,
      "This form can no longer be edited because it is not a Draft"
    );
  }

  return updatedForm;
};

// Delete a form only while it is a Draft
const deleteForm = async (adminId, formId) => {
  validateFormId(formId);

  const deletedForm = await Form.findOneAndDelete({
    _id: formId,
    owner: adminId,
    status: "Draft",
  });

  if (!deletedForm) {
    const existingForm = await Form.exists({
      _id: formId,
      owner: adminId,
    });

    if (!existingForm) {
      throw new ApiError(404, "Form not found");
    }

    throw new ApiError(
      409,
      "This form cannot be deleted because it is not a Draft"
    );
  }

  return deletedForm;
};

module.exports = {
  createForm,
  getAdminForms,
  getFormById,
  updateForm,
  deleteForm,
};
