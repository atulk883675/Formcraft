const {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} = require("./admin.service");

const ApiResponse = require("../../utils/ApiResponse");

// Get the authenticated Admin's profile.
const getProfile = async (req, res) => {
  const admin = await getAdminProfile(req.auth.adminId);

  res.status(200).json(
    new ApiResponse(
      200,
      { admin },
      "Profile retrieved successfully"
    )
  );
};

// Update the authenticated Admin's profile.
const updateProfile = async (req, res) => {
  const { name } = req.body;

  const admin = await updateAdminProfile(
    req.auth.adminId,
    name
  );

  res.status(200).json(
    new ApiResponse(
      200,
      { admin },
      "Profile updated successfully"
    )
  );
};

// Change the authenticated Admin's password.
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await changeAdminPassword(
    req.auth.adminId,
    currentPassword,
    newPassword
  );

  res.status(200).json(
    new ApiResponse(
      200,
      null,
      result.message
    )
  );
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
