import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { CategoryController } from "./categories.controller.js";
import { CategoryValidation } from "./categories.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.createCategoryZodSchema),
  CategoryController.createCategory,
);

router.get(
  "/",
  auth(),
  CategoryController.getAllCategories,
);

router.get(
  "/:id",
  auth(),
  CategoryController.getCategoryById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.updateCategoryZodSchema),
  CategoryController.updateCategory,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.updateCategoryStatusZodSchema),
  CategoryController.updateCategoryStatus,
);

export const CategoryRoutes = router;
export default router;
