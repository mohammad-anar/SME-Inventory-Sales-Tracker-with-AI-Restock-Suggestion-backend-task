import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { StockMovementController } from "./stock-movements.controller.js";
import { StockMovementValidation } from "./stock-movements.validation.js";

const router = express.Router();

router.get(
  "/",
  auth(Role.ADMIN, Role.STAFF),
  StockMovementController.getStockMovements,
);

router.post(
  "/adjustments",
  auth(Role.ADMIN, Role.STAFF),
  validateRequest(StockMovementValidation.adjustStockZodSchema),
  StockMovementController.adjustStock,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.STAFF),
  StockMovementController.getStockMovementById,
);

export const StockMovementRoutes = router;
export default router;
