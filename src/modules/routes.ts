import express from "express";
import { AuthRoutes } from "./auth/auth.route.js";
import { UserRoutes } from "./users/users.route.js";
import { ProfileRoutes } from "./users/profile.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/profile", route: ProfileRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
