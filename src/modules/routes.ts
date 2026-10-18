import express from "express";
import { AuthRoutes } from "./auth/auth.route.js";
import { UserRoutes } from "./users/users.route.js";
import { ProfileRoutes } from "./users/profile.route.js";
import { CategoryRoutes } from "./categories/categories.route.js";
import { SupplierRoutes } from "./suppliers/suppliers.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/profile", route: ProfileRoutes },
  { path: "/categories", route: CategoryRoutes },
  { path: "/suppliers", route: SupplierRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
