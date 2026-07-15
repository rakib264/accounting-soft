import { z } from "zod";

/** Trim whitespace and reject empty strings */
export const trimmedRequired = (label: string, min = 1) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(min, `${label} is required.`));

export const trimmedOptional = z
  .string()
  .transform((value) => value.trim())
  .optional();

export const trimmedEmail = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.string().email("Enter a valid email address."));

export const positiveAmount = z
  .number({ error: "Amount must be a number." })
  .min(0, "Amount must be zero or greater.");

export const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.");
