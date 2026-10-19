import express from "express";
import { AuthRoutes } from "./auth/auth.route.js";
import { UserRoutes } from "./users/users.route.js";
import { ProfileRoutes } from "./users/profile.route.js";
import { CategoryRoutes } from "./categories/categories.route.js";
import { SupplierRoutes } from "./suppliers/suppliers.route.js";
import { ProductRoutes } from "./products/products.route.js";
import { SaleRoutes } from "./sales/sales.route.js";
import { SaleItemRoutes } from "./sale-items/sale-items.route.js";
import { PurchaseOrderRoutes } from "./purchase-orders/purchase-orders.route.js";
import { StaffRoutes } from "./staff/staff.route.js";
import { AiRestockRoutes } from "./ai-restock/ai-restock.route.js";
import { StockMovementRoutes } from "./stock-movements/stock-movements.route.js";
import { DashboardRoutes } from "./dashboard/dashboard.route.js";
import { ReportRoutes } from "./reports/reports.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/profile", route: ProfileRoutes },
  { path: "/staff", route: StaffRoutes },
  { path: "/categories", route: CategoryRoutes },
  { path: "/suppliers", route: SupplierRoutes },
  { path: "/products", route: ProductRoutes },
  { path: "/sales", route: SaleRoutes },
  { path: "/sale-items", route: SaleItemRoutes },
  { path: "/purchase-orders", route: PurchaseOrderRoutes },
  { path: "/ai-restock", route: AiRestockRoutes },
  { path: "/stock-movements", route: StockMovementRoutes },
  { path: "/dashboard", route: DashboardRoutes },
  { path: "/reports", route: ReportRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
