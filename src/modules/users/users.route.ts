import express from "express";
import { Role } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { UserController } from "./users.controller.js";
import { UserValidation } from "./users.validation.js";

const router = express.Router();

router.post(
  "/staff",
  auth(Role.ADMIN),
  validateRequest(UserValidation.createStaffZodSchema),
  UserController.createStaffAccount,
);

router.post(
  "/:id/setup-token",
  auth(Role.ADMIN),
  UserController.generateSetupToken,
);

router.patch(
  "/:id/status",
  auth(Role.ADMIN),
  validateRequest(UserValidation.updateUserStatusZodSchema),
  UserController.updateUserStatus,
);

router.get(
  "/:id/sales",
  auth(Role.ADMIN),
  UserController.getStaffSales,
);

router.get(
  "/:id/activities",
  auth(Role.ADMIN),
  UserController.getStaffActivities,
);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser,
);

router.get(
  "/",
  auth(Role.ADMIN),
  UserController.getAllUsers,
);

router.get(
  "/:id",
  auth(Role.ADMIN),
  UserController.getUserById,
);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateUser,
);

router.patch(
  "/:id/password",
  auth(Role.ADMIN),
  validateRequest(UserValidation.updatePasswordZodSchema),
  UserController.updateUserPassword,
);

export const UserRoutes = router;
export default router;
