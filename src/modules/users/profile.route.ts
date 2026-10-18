import express from "express";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { UserController } from "./users.controller.js";
import { UserValidation } from "./users.validation.js";

const router = express.Router();

router.get(
  "/",
  auth(),
  UserController.getProfile,
);

router.patch(
  "/",
  auth(),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateProfile,
);

export const ProfileRoutes = router;
export default router;
