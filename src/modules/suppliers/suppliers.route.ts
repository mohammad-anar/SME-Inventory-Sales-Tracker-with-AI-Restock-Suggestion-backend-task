import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { SupplierController } from "./suppliers.controller.js";
import { SupplierValidation } from "./suppliers.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(SupplierValidation.createSupplierZodSchema),
  SupplierController.createSupplier,
);

router.get(
  "/",
  auth(),
  SupplierController.getAllSuppliers,
);

router.get(
  "/:id",
  auth(),
  SupplierController.getSupplierById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(SupplierValidation.updateSupplierZodSchema),
  SupplierController.updateSupplier,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(SupplierValidation.updateSupplierStatusZodSchema),
  SupplierController.updateSupplierStatus,
);

export const SupplierRoutes = router;
export default router;
