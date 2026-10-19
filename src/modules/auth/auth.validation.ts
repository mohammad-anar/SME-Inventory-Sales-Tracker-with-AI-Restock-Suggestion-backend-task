import { z } from "zod";

const loginZodSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required"),
  password: z
    .string()
    .min(1, "Password is required"),
});

const registerZodSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phone: z.string().trim().optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
});

const setPasswordZodSchema = z.object({
  token: z.string().trim().min(1, "Setup token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const verifySetupTokenZodSchema = z.object({
  token: z.string().trim().min(1, "Setup token is required"),
});

export const AuthValidation = {
  loginZodSchema,
  registerZodSchema,
  setPasswordZodSchema,
  verifySetupTokenZodSchema,
};

export default AuthValidation;
