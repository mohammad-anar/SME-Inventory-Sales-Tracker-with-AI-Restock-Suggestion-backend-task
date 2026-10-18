import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { SaleItemController } from "./sale-items.controller.js";
import { SaleItemValidation } from "./sale-items.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(SaleItemValidation.createSaleItemZodSchema),
  SaleItemController.createSaleItem,
);

router.get(
  "/",
  auth(),
  SaleItemController.getAllSaleItems,
);

router.get(
  "/:id",
  auth(),
  SaleItemController.getSaleItemById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(SaleItemValidation.updateSaleItemZodSchema),
  SaleItemController.updateSaleItem,
);

router.delete(
  "/:id",
  auth(Role.ADMIN, Role.STAFF),
  SaleItemController.deleteSaleItem,
);

export const SaleItemRoutes = router;
export default router;
