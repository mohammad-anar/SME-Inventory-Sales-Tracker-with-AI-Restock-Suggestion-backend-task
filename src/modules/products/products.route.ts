import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { ProductController } from "./products.controller.js";
import { ProductValidation } from "./products.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(ProductValidation.createProductZodSchema),
  ProductController.createProduct,
);

router.get(
  "/",
  auth(),
  ProductController.getAllProducts,
);

router.get(
  "/low-stock",
  auth(),
  ProductController.getLowStockProducts,
);

router.get(
  "/:id",
  auth(),
  ProductController.getProductById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(ProductValidation.updateProductZodSchema),
  ProductController.updateProduct,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(ProductValidation.updateProductStatusZodSchema),
  ProductController.updateProductStatus,
);

export const ProductRoutes = router;
export default router;
