import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email("Valid email is required")
  .or(z.literal(""))
  .optional()
  .nullable();

const createSupplierZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Supplier name cannot be empty"),
  phone: z.string().trim().optional().nullable(),
  email: emailSchema,
  address: z.string().trim().optional().nullable(),
});

const updateSupplierZodSchema = z
  .object({
    name: z.string().trim().min(1, "Supplier name cannot be empty").optional(),
    phone: z.string().trim().optional().nullable(),
    email: emailSchema,
    address: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.phone !== undefined ||
      data.email !== undefined ||
      data.address !== undefined,
    {
      message: "At least one field must be provided for update",
    },
  );

const updateSupplierStatusZodSchema = z.object({
  isActive: z.boolean(),
});

export const SupplierValidation = {
  createSupplierZodSchema,
  updateSupplierZodSchema,
  updateSupplierStatusZodSchema,
};

export default SupplierValidation;
