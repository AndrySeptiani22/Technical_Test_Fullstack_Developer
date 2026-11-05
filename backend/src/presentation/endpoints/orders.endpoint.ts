import { Router } from "express";
import { OrderRepository } from "@infrastructure/repositories/order.repository";
import { OrderUseCase } from "@application/use-cases/orders/order.use-case";
import dataSource from "@infrastructure/config/db-context";
import { asyncRoute } from "./endpoint-helpers";
import {
  authenticate,
  getAuth,
  requirePermission,
} from "@presentation/middleware/shop-auth.middleware";
import {
  NotFoundError,
  ValidationError,
} from "@application/models/error/application.error";
import { rateLimit } from "@presentation/middleware/rate-limit.middleware";
import { parseRequest } from "@application/models/validators/common.validator";
import {
  emptyRequestSchema,
  orderCancelRequestSchema,
  orderCreateRequestSchema,
  orderIdempotencyHeaderSchema,
  orderIdParamsSchema,
  orderListQuerySchema,
} from "@application/models/validators/order.validator";
import type {
  EmptyRequest,
  OrderCancelRequest,
  OrderCreateRequest,
  OrderIdParams,
  OrderIdempotencyHeader,
  OrderListRequest,
} from "@application/models/requests/order.request";
import {
  orderCreatedResponse,
  invoiceResponse,
  orderListResponse,
  orderResponse,
} from "@application/models/response/order.response";

const router = Router();
const useCase = new OrderUseCase(new OrderRepository(dataSource));

router.use(authenticate);
router.get(
  "/",
  requirePermission("orders.view"),
  asyncRoute(async (req, res) => {
    const query: OrderListRequest = parseRequest(
      orderListQuerySchema,
      req.query,
    );
    const result = await useCase.list({
      page: query.page,
      limit: Math.min(query.limit ?? query.pageSize ?? 20, 100),
      status: query.status,
      customerId: query.customer_id,
      from: query.from,
      to: query.to,
    });
    res.status(200).json(orderListResponse(result.items, result.meta));
  }),
);
router.post(
  "/",
  rateLimit({ windowMs: 60 * 1000, max: 30, keyPrefix: "order-create" }),
  requirePermission("orders.create"),
  asyncRoute(async (req, res) => {
    const body: OrderCreateRequest = parseRequest(
      orderCreateRequestSchema,
      req.body,
    );
    const header: OrderIdempotencyHeader = parseRequest(
      orderIdempotencyHeaderSchema,
      { "Idempotency-Key": req.get("Idempotency-Key") },
    );
    const idempotencyKey = header["Idempotency-Key"];
    const auth = getAuth(req);
    const result = await useCase.create({
      userId: auth.userId,
      idempotencyKey,
      customerId: body.customer_id,
      items: body.items.map((item) => ({
        productId: item.product_id,
        quantity: item.quantity,
      })),
    });
    res.setHeader("Idempotency-Replayed", result.replayed ? "true" : "false");
    res
      .status(result.responseStatus)
      .json(result.responseBody ?? orderCreatedResponse(result.order));
  }),
);
router.get(
  "/:id",
  requirePermission("orders.view"),
  asyncRoute(async (req, res) => {
    const params: OrderIdParams = parseRequest(orderIdParamsSchema, req.params);
    const order = await useCase.getById(params.id);
    if (!order) throw new NotFoundError("Order not found.");
    res.status(200).json(orderResponse("OK", order));
  }),
);

const actionRoutes = [
  { action: "pay" as const, permission: "orders.pay" },
  { action: "ship" as const, permission: "orders.ship" },
  { action: "complete" as const, permission: "orders.complete" },
  { action: "cancel" as const, permission: "orders.cancel" },
];
for (const route of actionRoutes) {
  router.post(
    `/:id/${route.action}`,
    requirePermission(route.permission),
    asyncRoute(async (req, res) => {
      const params: OrderIdParams = parseRequest(
        orderIdParamsSchema,
        req.params,
      );
      let reason: string | undefined;
      if (route.action === "cancel") {
        const body: OrderCancelRequest = parseRequest(
          orderCancelRequestSchema,
          req.body ?? {},
        );
        reason = body.cancel_reason;
      } else {
        const _body: EmptyRequest = parseRequest(
          emptyRequestSchema,
          req.body ?? {},
        );
      }
      const auth = getAuth(req);
      const result = await useCase.transition({
        orderId: params.id,
        userId: auth.userId,
        role: auth.roleCode === "admin" ? "admin" : "cashier",
        action: route.action,
        ...(reason ? { reason } : {}),
      });
      res
        .status(200)
        .json(orderResponse(`Order ${route.action} successful.`, result));
    }),
  );
}

router.get(
  "/:id/invoice",
  requirePermission("orders.invoice"),
  asyncRoute(async (req, res) => {
    const params: OrderIdParams = parseRequest(orderIdParamsSchema, req.params);
    const order = await useCase.getById(params.id);
    if (!order) throw new NotFoundError("Order not found.");
    if (!order.paidAt)
      throw new ValidationError(
        "Invoice is available after the order is paid.",
      );
    const invoice = invoiceResponse(order);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${invoice.fileName}"`,
    );
    res.type("html").send(invoice.content);
  }),
);

export default router;
