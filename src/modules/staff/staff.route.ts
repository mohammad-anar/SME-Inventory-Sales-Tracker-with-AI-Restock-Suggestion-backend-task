import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { UserValidation } from "../users/users.validation.js";
import { StaffController } from "./staff.controller.js";

const router = express.Router();

router.get(
  "/me",
  auth(Role.STAFF, Role.ADMIN),
  StaffController.getStaffProfile,
);

router.patch(
  "/me",
  auth(Role.STAFF, Role.ADMIN),
  validateRequest(UserValidation.updateProfileZodSchema),
  StaffController.updateStaffProfile,
);

router.get(
  "/me/sales",
  auth(Role.STAFF, Role.ADMIN),
  StaffController.getStaffSales,
);

router.get(
  "/me/sales/summary",
  auth(Role.STAFF, Role.ADMIN),
  StaffController.getStaffSalesSummary,
);

router.get(
  "/me/activities",
  auth(Role.STAFF, Role.ADMIN),
  StaffController.getStaffActivities,
);

export const StaffRoutes = router;
export default router;
