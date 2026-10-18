import express from "express";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { AuthController } from "./auth.controller.js";
import { AuthValidation } from "./auth.validation.js";

const router = express.Router();

router.post(
  "/login",
  validateRequest(AuthValidation.loginZodSchema),
  AuthController.loginUser,
);

router.get(
  "/me",
  auth(),
  AuthController.getMe,
);

router.post(
  "/logout",
  auth(),
  AuthController.logoutUser,
);

export const AuthRoutes = router;
export default router;
