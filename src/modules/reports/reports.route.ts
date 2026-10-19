import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import { ReportController } from "./reports.controller.js";

const router = express.Router();

router.get(
  "/inventory-valuation",
  auth(Role.ADMIN, Role.STAFF),
  ReportController.getInventoryValuation,
);

router.get(
  "/sales",
  auth(Role.ADMIN, Role.STAFF),
  ReportController.getSalesReport,
);

router.get(
  "/purchases",
  auth(Role.ADMIN, Role.STAFF),
  ReportController.getPurchaseReport,
);

export const ReportRoutes = router;
export default router;
