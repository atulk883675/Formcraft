const Admin = require("../auth/auth.model");
const ApiError = require("../../utils/ApiError");
const { hashPassword, comparePassword } = require("../../utils/password");

// Return only fields that are safe to expose to the frontend.
const formatAdminProfile = (admin) => ({
  id: admin._id.toString(),
  name: admin.name,
  email: admin.email,
  isEmailVerified: admin.isEmailVerified,
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

// Get the authenticated Admin's profile.
const getAdminProfile = async (adminId) => {
  const admin = await Admin.findById(adminId).select(
    "name email isEmailVerified createdAt updatedAt"
  );

  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  return formatAdminProfile(admin);
};

// Update the authenticated Admin's name.
const updateAdminProfile = async (adminId, name) => {
  const admin = await Admin.findByIdAndUpdate(
    adminId,
    { $set: { name } },
    {
      new: true,
      runValidators: true,
    }
  ).select("name email isEmailVerified createdAt updatedAt");

  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  return formatAdminProfile(admin);
};

// Change password and revoke all active sessions.
const changeAdminPassword = async (
  adminId,
  currentPassword,
  newPassword
) => {
  // Password is select:false in the Admin model, so explicitly include it.
  const admin = await Admin.findById(adminId).select("+password");

  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  const isPasswordCorrect = await comparePassword(
    currentPassword,
    admin.password
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Current password is incorrect");
  }

  const hashedPassword = await hashPassword(newPassword);
  const now = new Date();

  admin.password = hashedPassword;

  // Revoke every currently active session.
  admin.refreshSessions.forEach((session) => {
    const isActive =
      session.revokedAt === null &&
      session.expiresAt > now;

    if (isActive) {
      session.revokedAt = now;
      session.revokeReason = "password_changed";
    }
  });

  await admin.save();

  return {
    message: "Password changed successfully. Please log in again.",
  };
};

module.exports = {
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
};
