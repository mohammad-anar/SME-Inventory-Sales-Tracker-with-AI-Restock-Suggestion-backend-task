import { z } from "zod";

const createSaleItemZodSchema = z.object({
  saleId: z.string().trim().min(1, "Sale ID is required"),
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),
});

const updateSaleItemZodSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),
});

export const SaleItemValidation = {
  createSaleItemZodSchema,
  updateSaleItemZodSchema,
};

export default SaleItemValidation;
