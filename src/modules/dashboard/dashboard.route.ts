import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import { DashboardController } from "./dashboard.controller.js";

const router = express.Router();

router.get(
  "/summary",
  auth(Role.ADMIN, Role.STAFF),
  DashboardController.getDashboardSummary,
);

router.get(
  "/sales-trend",
  auth(Role.ADMIN, Role.STAFF),
  DashboardController.getSalesTrend,
);

router.get(
  "/top-products",
  auth(Role.ADMIN, Role.STAFF),
  DashboardController.getTopProducts,
);

export const DashboardRoutes = router;
export default router;
