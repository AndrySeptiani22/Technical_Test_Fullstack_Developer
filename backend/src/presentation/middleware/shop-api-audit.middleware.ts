import { randomUUID } from "crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { AuditApi } from "@domain/entities";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import dataSource from "@infrastructure/config/db-context";
import { getBrowserUserAgent } from "@infrastructure/utilities/browser-user-agent";
import type { ShopRequest } from "./shop-auth.middleware";

const swaggerAssetPattern =
  /^\/(?:favicon(?:-[\w-]+)?\.ico|favicon-[\w-]+\.png|swagger-ui-[\w-]+\.(?:js|css)|swagger-ui\.(?:js|css)|oauth2-redirect\.html)$/i;

export function isSwaggerAssetRequest(
  path: string,
  referer?: string,
  accept?: string,
): boolean {
  const normalizedPath = path.replace(/\/+$/, "") || "/";
  if (
    normalizedPath === "/api-docs.json" ||
    (normalizedPath.startsWith("/api-docs/") && normalizedPath !== "/api-docs")
  ) {
    return true;
  }
  if (swaggerAssetPattern.test(normalizedPath)) return true;
  if (normalizedPath === "/" && accept?.includes("text/html")) {
    return true;
  }
  if (normalizedPath === "/" && referer) {
    try {
      return new URL(referer).pathname
        .replace(/\/+$/, "")
        .startsWith("/api-docs");
    } catch {
      return false;
    }
  }
  return false;
}

export const shopApiAudit: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (isSwaggerAssetRequest(req.path, req.get("referer"), req.get("accept"))) {
    next();
    return;
  }
  const docsPageRequest =
    req.method === "GET" && /^\/api-docs\/?$/.test(req.path);
  const incomingRequestId = req.get("X-Request-Id")?.trim();
  const requestId =
    incomingRequestId &&
    incomingRequestId.length <= 128 &&
    /^[A-Za-z0-9._:-]+$/.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();
  const traceId = randomUUID().replaceAll("-", "");
  const correlationId = randomUUID();
  const idempotencyKey = req.get("Idempotency-Key");
  const browser = getBrowserUserAgent(req.get("user-agent"));
  (req as ShopRequest).requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  res.setHeader("X-Trace-ID", traceId);
  res.setHeader("X-Correlation-ID", correlationId);
  const startedAt = Date.now();

  const responseEvents = res as unknown as {
    once(event: "finish", listener: () => void): void;
  };
  responseEvents.once("finish", () => {
    if (docsPageRequest && res.statusCode >= 300 && res.statusCode < 400) {
      return;
    }
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
        path: docsPageRequest ? "/api-docs" : req.path.slice(0, 2000),
        route: docsPageRequest ? "/api-docs" : (route?.slice(0, 200) ?? null),
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
        userAgent: browser,
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
      userAgent: browser,
      correlationId: requestId,
    },
    next,
  );
};
