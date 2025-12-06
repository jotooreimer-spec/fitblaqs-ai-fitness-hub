import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-ZäöüÄÖÜß\s'-]+$/, "Name contains invalid characters"),
  age: z
    .string()
    .min(1, "Age is required")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 13 && num <= 120;
    }, "Age must be between 13 and 120"),
  weight: z
    .string()
    .min(1, "Weight is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 500;
    }, "Weight must be between 0 and 500"),
  height: z
    .string()
    .min(1, "Height is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 300;
    }, "Height must be between 0 and 300"),
  gender: z
    .string()
    .min(1, "Gender is required")
    .refine((val) => ["male", "female"].includes(val), "Invalid gender"),
  language: z.enum(["de", "en"]),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const getValidationErrors = (error: z.ZodError): Record<string, string> => {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    if (err.path[0]) {
      errors[err.path[0] as string] = err.message;
    }
  });
  return errors;
};
