import cors from "cors";
import express, { Application, Request, Response } from "express";
import env from "./config/env.js";
import routes from "./modules/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";

const app: Application = express();
const corsOrigins = env.cors_origin || "*";

app.use(
  cors({
    origin: corsOrigins.includes(",")
      ? corsOrigins.split(",").map((origin) => origin.trim().replace(/\/+$/, ""))
      : corsOrigins === "*"
      ? "*"
      : [corsOrigins.trim().replace(/\/+$/, "")],
    credentials: true,
  }),
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use(express.static("uploads"));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "StockPilot API Documentation",
  }),
);

app.get("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API Router
app.use("/api/v1", routes);

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "LMS API Server is running...",
    environment: env.node_env,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

// Error handling middlewares
app.use(errorHandler);
app.use(notFoundHandler);

export default app;
