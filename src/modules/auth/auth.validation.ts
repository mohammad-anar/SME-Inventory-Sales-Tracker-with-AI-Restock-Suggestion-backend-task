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

export const AuthValidation = {
  loginZodSchema,
};

export default AuthValidation;
