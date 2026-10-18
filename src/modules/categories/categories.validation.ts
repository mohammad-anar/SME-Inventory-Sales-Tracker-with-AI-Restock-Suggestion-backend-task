import { z } from "zod";

const createCategoryZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name cannot be empty"),
  description: z.string().trim().optional(),
});

const updateCategoryZodSchema = z
  .object({
    name: z.string().trim().min(1, "Category name cannot be empty").optional(),
    description: z.string().trim().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    {
      message: "At least one field (name or description) must be provided for update",
    },
  );

const updateCategoryStatusZodSchema = z.object({
  isActive: z.boolean(),
});

export const CategoryValidation = {
  createCategoryZodSchema,
  updateCategoryZodSchema,
  updateCategoryStatusZodSchema,
};

export default CategoryValidation;
