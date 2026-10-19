import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { AiRestockValidation } from "./ai-restock.validation.js";
import { AiRestockController } from "./ai-restock.controller.js";

const router = express.Router();

router.get(
  "/recommendations",
  auth(Role.ADMIN, Role.STAFF),
  AiRestockController.getRestockRecommendations,
);

router.get(
  "/products/:id",
  auth(Role.ADMIN, Role.STAFF),
  AiRestockController.getProductForecast,
);

router.post(
  "/refresh",
  auth(Role.ADMIN, Role.STAFF),
  AiRestockController.refreshRestockRecommendations,
);

export const AiRestockRoutes = router;
export default router;
