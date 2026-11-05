import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import swaggerUi from "swagger-ui-express";
import dataSource from "@infrastructure/config/db-context";
import { Role } from "@domain/entities";
import authEndpoint from "./auth.endpoint";
import productsEndpoint from "./products.endpoint";
import customersEndpoint from "./customers.endpoint";
import ordersEndpoint from "./orders.endpoint";
import reportsEndpoint from "./reports.endpoint";
import dashboardEndpoint from "./dashboard.endpoint";
import {
  apiHealthResponse,
  healthResponse,
  unhealthyResponse,
} from "@application/models/response/health.response";
import openApiDocument from "@presentation/swagger/openapi";

const router = express.Router();
const api = express.Router();

router.get("/api-docs.json", (_req, res) => {
  res.json(openApiDocument);
});
router.use(
  "/api-docs",
  (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self' data:",
    );
    next();
  },
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "Azatech Shop API - Swagger UI",
    swaggerOptions: { persistAuthorization: true },
  }),
);

api.use("/auth", authEndpoint);
api.use("/products", productsEndpoint);
api.use("/customers", customersEndpoint);
api.use("/orders", ordersEndpoint);
api.use("/reports", reportsEndpoint);
api.use("/dashboard", dashboardEndpoint);

api.get("/health", async (_req, res) => {
  try {
    await dataSource.getRepository(Role).count();
    res.status(200).json(apiHealthResponse(healthResponse()));
  } catch {
    res.status(503).json(apiHealthResponse(unhealthyResponse()));
  }
});

router.use("/api", api);
router.get("/health", async (_req, res) => {
  try {
    await dataSource.getRepository(Role).count();
    res.status(200).json(healthResponse());
  } catch {
    res.status(503).json(unhealthyResponse());
  }
});

export default router;
