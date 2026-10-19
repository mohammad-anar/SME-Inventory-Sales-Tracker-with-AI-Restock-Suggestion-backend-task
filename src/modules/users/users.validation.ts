import { z } from "zod";
import { Role } from "@prisma/client";

const createUserZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
  role: z.enum([Role.ADMIN, Role.STAFF]).optional().default(Role.STAFF),
  phone: z.string().trim().optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
});

const createStaffZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Valid email is required"),
  phone: z.string().trim().optional().nullable(),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
});

const updateUserZodSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  email: z.string().trim().toLowerCase().email("Valid email is required").optional(),
  role: z.enum([Role.ADMIN, Role.STAFF]).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().trim().optional().nullable(),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
});

const updateUserStatusZodSchema = z.object({
  isActive: z.boolean(),
});

const updatePasswordZodSchema = z.object({
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long"),
});

const updateProfileZodSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").optional(),
  phone: z.string().trim().optional().nullable(),
  avatar: z.string().url("Avatar must be a valid URL").optional().nullable(),
});

export const UserValidation = {
  createUserZodSchema,
  createStaffZodSchema,
  updateUserZodSchema,
  updateUserStatusZodSchema,
  updatePasswordZodSchema,
  updateProfileZodSchema,
};

export default UserValidation;
