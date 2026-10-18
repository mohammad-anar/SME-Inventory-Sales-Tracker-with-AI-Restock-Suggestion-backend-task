import { z } from "zod";
import { PurchaseOrderStatus } from "@prisma/client";

const purchaseOrderItemZodSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than zero"),
  unitCost: z.union([
    z.number().min(0, "Unit cost cannot be negative"),
    z
      .string()
      .trim()
      .refine((val) => {
        const num = Number(val);
        return !isNaN(num) && num >= 0;
      }, "Unit cost must be a non-negative number"),
  ]),
});

const createPurchaseOrderZodSchema = z.object({
  supplierId: z.string().trim().min(1, "Supplier ID is required"),
  note: z.string().trim().optional().nullable(),
  items: z
    .array(purchaseOrderItemZodSchema)
    .min(1, "At least one item is required in the purchase order"),
});

const updatePurchaseOrderZodSchema = z
  .object({
    supplierId: z.string().trim().min(1, "Supplier ID cannot be empty").optional(),
    note: z.string().trim().optional().nullable(),
    items: z
      .array(purchaseOrderItemZodSchema)
      .min(1, "At least one item is required in the purchase order")
      .optional(),
  })
  .refine(
    (data) =>
      data.supplierId !== undefined ||
      data.note !== undefined ||
      data.items !== undefined,
    {
      message: "At least one field must be provided for update",
    },
  );

const updatePurchaseOrderStatusZodSchema = z.object({
  status: z.enum([
    PurchaseOrderStatus.DRAFT,
    PurchaseOrderStatus.ORDERED,
    PurchaseOrderStatus.RECEIVED,
    PurchaseOrderStatus.CANCELLED,
  ]),
});

export const PurchaseOrderValidation = {
  createPurchaseOrderZodSchema,
  updatePurchaseOrderZodSchema,
  updatePurchaseOrderStatusZodSchema,
};

export default PurchaseOrderValidation;
