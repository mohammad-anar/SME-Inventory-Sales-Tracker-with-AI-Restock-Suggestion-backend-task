import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

const saleItemZodSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),
});

const createSaleZodSchema = z.object({
  customerName: z.string().trim().optional().nullable(),
  discount: z
    .union([
      z.number().min(0, "Discount cannot be negative"),
      z
        .string()
        .trim()
        .refine((val) => {
          const num = Number(val);
          return !isNaN(num) && num >= 0;
        }, "Discount must be a non-negative number"),
    ])
    .optional(),
  paymentMethod: z
    .enum([
      PaymentMethod.CASH,
      PaymentMethod.CARD,
      PaymentMethod.MOBILE_BANKING,
    ])
    .optional(),
  items: z
    .array(saleItemZodSchema)
    .min(1, "At least one product item is required"),
});

export const SaleValidation = {
  createSaleZodSchema,
};

export default SaleValidation;
