
const { z } = require("zod");

const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must not exceed 100 characters"),
  })
  .strict();

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, "Current password must be at least 8 characters")
      .max(128, "Current password must not exceed 128 characters"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password must not exceed 128 characters"),
  })
  .strict()
  .refine(
    (data) => data.currentPassword !== data.newPassword,
    {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }
  );

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
