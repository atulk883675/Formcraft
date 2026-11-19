
const { z } = require("zod");

const formCategories = [
  "Education",
  "Business",
  "Events",
  "Employment",
  "Healthcare",
  "General",
];

const createFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Form title is required")
      .max(150, "Form title cannot exceed 150 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    category: z
      .enum(formCategories, {
        errorMap: () => ({ message: "Invalid form category" }),
      })
      .optional(),
  })
  .strict();

const updateFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Form title is required")
      .max(150, "Form title cannot exceed 150 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),

    category: z
      .enum(formCategories, {
        errorMap: () => ({ message: "Invalid form category" }),
      })
      .optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
  );

module.exports = {
  createFormSchema,
  updateFormSchema,
};
