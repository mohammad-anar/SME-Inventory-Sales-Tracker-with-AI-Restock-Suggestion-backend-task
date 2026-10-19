import { z } from "zod";

const priceSchema = z.union([
  z.number().min(0, "Price cannot be negative"),
  z
    .string()
    .trim()
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, "Price must be a non-negative number"),
]);

const reorderLevelSchema = z.union([
  z
    .number()
    .int("Reorder level must be an integer")
    .min(0, "Reorder level cannot be negative"),
  z
    .string()
    .trim()
    .regex(/^\d+$/, "Reorder level must be a non-negative integer"),
]);

const createProductZodSchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Product name is required"),
  description: z.string().trim().optional().nullable(),
  barcode: z.string().trim().optional().nullable(),
  categoryId: z.string().trim().min(1, "Category ID is required"),
  supplierId: z.string().trim().min(1, "Supplier ID is required"),
  avatar: z.string().trim().optional().nullable(),
  unitPrice: priceSchema,
  costPrice: priceSchema,
  reorderLevel: reorderLevelSchema.optional(),
  stockQty: z
    .union([
      z.number().int("Stock quantity must be an integer").min(0, "Stock quantity cannot be negative"),
      z.string().trim().regex(/^\d+$/, "Stock quantity must be a non-negative integer"),
    ])
    .optional(),
});

const updateProductZodSchema = z
  .object({
    sku: z.string().trim().min(1, "SKU cannot be empty").optional(),
    name: z.string().trim().min(1, "Product name cannot be empty").optional(),
    description: z.string().trim().optional().nullable(),
    barcode: z.string().trim().optional().nullable(),
    categoryId: z.string().trim().min(1, "Category ID cannot be empty").optional(),
    supplierId: z.string().trim().min(1, "Supplier ID cannot be empty").optional(),
    avatar: z.string().trim().optional().nullable(),
    unitPrice: priceSchema.optional(),
    costPrice: priceSchema.optional(),
    reorderLevel: reorderLevelSchema.optional(),
  })
  .refine(
    (data) =>
      data.sku !== undefined ||
      data.name !== undefined ||
      data.description !== undefined ||
      data.barcode !== undefined ||
      data.categoryId !== undefined ||
      data.supplierId !== undefined ||
      data.avatar !== undefined ||
      data.unitPrice !== undefined ||
      data.costPrice !== undefined ||
      data.reorderLevel !== undefined,
    {
      message: "At least one field must be provided for update",
    },
  );

const updateProductStatusZodSchema = z.object({
  isActive: z.boolean(),
});

export const ProductValidation = {
  createProductZodSchema,
  updateProductZodSchema,
  updateProductStatusZodSchema,
};

export default ProductValidation;
