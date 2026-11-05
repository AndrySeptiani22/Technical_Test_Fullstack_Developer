import "reflect-metadata";

import { notFoundMiddleware } from "./presentation/middleware/not-found-middleware";
import { errorHandlerMiddleware } from "./presentation/middleware/error-handler-middleware";
import express, { type Request, type Response, type NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import methodOverride from "method-override";

import routes from "./presentation/endpoints";
import { shopApiAudit } from "./presentation/middleware/shop-api-audit.middleware";
import appConfig from "@infrastructure/config/app-config";

const app = express();

app.disable("x-powered-by");

// Security Headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  if (appConfig.isProduction) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader("Permissions-Policy", "geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");

  next();
});

// CORS
app.use(
  cors({
    origin: appConfig.corsOrigins,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    exposedHeaders: ["X-Request-ID", "X-Trace-ID", "X-Correlation-ID"],
    credentials: true,
  }) as unknown as express.RequestHandler,
);

// Middleware
app.use(morgan(appConfig.isProduction ? "combined" : "dev"));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(methodOverride());

app.use(shopApiAudit);

// Register Routes
app.use(routes);

// Error Handler
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
