
const path = require("path");
const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),

  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(64, "JWT_ACCESS_SECRET must be at least 64 characters"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Resend email configuration
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required"),

  EMAIL_FROM: z
    .string()
    .min(1, "EMAIL_FROM is required"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.issues);
  process.exit(1);
}

module.exports = result.data;
