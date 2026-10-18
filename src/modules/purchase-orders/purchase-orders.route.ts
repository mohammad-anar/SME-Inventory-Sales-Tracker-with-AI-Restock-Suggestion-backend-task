import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { PurchaseOrderController } from "./purchase-orders.controller.js";
import { PurchaseOrderValidation } from "./purchase-orders.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(PurchaseOrderValidation.createPurchaseOrderZodSchema),
  PurchaseOrderController.createPurchaseOrder,
);

router.get(
  "/",
  auth(),
  PurchaseOrderController.getAllPurchaseOrders,
);

router.get(
  "/:id/receipt",
  auth(),
  PurchaseOrderController.getPurchaseOrderReceipt,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(PurchaseOrderValidation.updatePurchaseOrderStatusZodSchema),
  PurchaseOrderController.updatePurchaseOrderStatus,
);

router.post(
  "/:id/receive",
  auth(Role.ADMIN, Role.STAFF),
  PurchaseOrderController.receivePurchaseOrder,
);

router.get(
  "/:id",
  auth(),
  PurchaseOrderController.getPurchaseOrderById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(PurchaseOrderValidation.updatePurchaseOrderZodSchema),
  PurchaseOrderController.updatePurchaseOrder,
);

export const PurchaseOrderRoutes = router;
export default router;
