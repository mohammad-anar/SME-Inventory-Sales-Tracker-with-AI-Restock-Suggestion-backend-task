import { z } from "zod";

const adjustStockZodSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantityChange: z.number().int("Quantity change must be an integer").refine((val) => val !== 0, {
    message: "Quantity change cannot be zero",
  }),
  note: z.string().trim().optional(),
});

export const StockMovementValidation = {
  adjustStockZodSchema,
};

export default StockMovementValidation;
