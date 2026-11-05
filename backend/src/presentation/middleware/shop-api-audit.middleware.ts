import { randomUUID } from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AuditApi } from "@domain/entities";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import dataSource from "@infrastructure/config/db-context";
import type { ShopRequest } from "./shop-auth.middleware";

export const shopApiAudit: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const requestId = randomUUID();
  const traceId = randomUUID().replaceAll("-", "");
  const correlationId = randomUUID();
  const idempotencyKey = req.get("Idempotency-Key");
  (req as ShopRequest).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  res.setHeader("X-Trace-ID", traceId);
  res.setHeader("X-Correlation-ID", correlationId);
  const startedAt = Date.now();

  const responseEvents = res as unknown as {
    once(event: "finish", listener: () => void): void;
  };
  responseEvents.once("finish", () => {
    const shopReq = req as ShopRequest;
    const route = req.route?.path
      ? `${req.baseUrl}${String(req.route.path)}`
      : null;
    void dataSource
      .getRepository(AuditApi)
      .save({
        requestId,
        userId: shopReq.auth?.userId ?? null,
        httpMethod: req.method,
        path: req.path.slice(0, 2000),
        route: route?.slice(0, 200) ?? null,
        queryParams: req.query,
        statusCode: res.statusCode,
        durationMs: Math.max(0, Date.now() - startedAt),
        idempotencyKey:
          idempotencyKey &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            idempotencyKey,
          )
            ? idempotencyKey
            : null,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("user-agent") ?? null,
        errorCode: res.statusCode >= 400 ? `HTTP_${res.statusCode}` : null,
        metadata: {},
      })
      .catch((error: unknown) => {
        console.error(
          `API audit write failed for request ${requestId}.`,
          error,
        );
      });
  });

  HTTPContextAccessor.run(
    {
      userId: null,
      email: null,
      permissions: [],
      ipAddress: req.ip || req.socket.remoteAddress || null,
      userAgent: req.get("user-agent") ?? null,
      correlationId: requestId,
    },
    next,
  );
};
