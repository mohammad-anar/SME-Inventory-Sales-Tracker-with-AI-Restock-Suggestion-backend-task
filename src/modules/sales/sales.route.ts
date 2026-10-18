import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { SaleController } from "./sales.controller.js";
import { SaleValidation } from "./sales.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(SaleValidation.createSaleZodSchema),
  SaleController.createSale,
);

router.get(
  "/",
  auth(),
  SaleController.getAllSales,
);

router.get(
  "/invoice/:invoiceNo",
  auth(),
  SaleController.getSaleByInvoiceNo,
);

router.get(
  "/:id",
  auth(),
  SaleController.getSaleById,
);

router.post(
  "/:id/void",
  auth(Role.ADMIN, Role.STAFF),
  SaleController.voidSale,
);

export const SaleRoutes = router;
export default router;
