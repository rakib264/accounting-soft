import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required."),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters."),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required."),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required."),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required."),
});

function loadEnv() {
  const parsed = envSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  });

  if (!parsed.success) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return {
        MONGODB_URI: "mongodb://127.0.0.1:27017/accounting",
        JWT_SECRET: "build-time-placeholder-secret-min-32-chars",
        NODE_ENV: "production" as const,
        CLOUDINARY_CLOUD_NAME: "placeholder",
        CLOUDINARY_API_KEY: "placeholder",
        CLOUDINARY_API_SECRET: "placeholder-secret-min-length-ok",
      };
    }

    const error = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid environment configuration. ${error}`);
  }

  return parsed.data;
}

export const env = loadEnv();
