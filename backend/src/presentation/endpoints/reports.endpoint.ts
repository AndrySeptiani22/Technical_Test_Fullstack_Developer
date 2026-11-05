import { Router } from "express";
import { Order, OrderItem } from "@domain/entities";
import { asyncRoute } from "./endpoint-helpers";
import {
  authenticate,
  requirePermission,
} from "@presentation/middleware/shop-auth.middleware";
import dataSource from "@infrastructure/config/db-context";
import { parseRequest } from "@application/models/validators/common.validator";
import {
  salesReportQuerySchema,
  topProductsReportQuerySchema,
} from "@application/models/validators/report.validator";
import type {
  SalesReportRequest,
  TopProductsReportRequest,
} from "@application/models/requests/report.request";
import {
  salesReportResponse,
  topProductsReportResponse,
  type SalesReportRow,
  type TopProductReportRow,
} from "@application/models/response/report.response";

const router = Router();
const reportStatuses = ["PAID", "SHIPPED", "COMPLETED"] as const;

function jakartaStartOfDay(date: string): Date {
  return new Date(`${date}T00:00:00.000+07:00`);
}

function jakartaEndExclusive(date: string): Date {
  return new Date(jakartaStartOfDay(date).getTime() + 24 * 60 * 60 * 1000);
}

router.use(authenticate);
router.get(
  "/sales",
  requirePermission("reports.sales"),
  asyncRoute(async (req, res) => {
    const query: SalesReportRequest = parseRequest(
      salesReportQuerySchema,
      req.query,
    );
    const rows = (await dataSource
      .getRepository(Order)
      .createQueryBuilder("order")
      .select("date_trunc(:groupBy, order.orderDate)", "period")
      .addSelect("COUNT(order.orderId)::int", "total_orders")
      .addSelect(
        "COALESCE(SUM(order.totalAmount), 0)::numeric(14,2)::text",
        "revenue",
      )
      .where("order.status IN (:...statuses)", { statuses: reportStatuses })
      .andWhere("order.orderDate >= :from", {
        from: jakartaStartOfDay(query.from),
      })
      .andWhere("order.orderDate < :to", {
        to: jakartaEndExclusive(query.to),
      })
      .setParameter("groupBy", query.group_by)
      .groupBy("date_trunc(:groupBy, order.orderDate)")
      .orderBy("period", "ASC")
      .getRawMany<SalesReportRow>()) as SalesReportRow[];
    res.status(200).json(salesReportResponse(rows));
  }),
);

router.get(
  "/top-products",
  requirePermission("reports.top_products"),
  asyncRoute(async (req, res) => {
    const query: TopProductsReportRequest = parseRequest(
      topProductsReportQuerySchema,
      req.query,
    );
    const rows = (await dataSource
      .getRepository(OrderItem)
      .createQueryBuilder("item")
      .innerJoin("item.order", "order")
      .innerJoin("item.product", "product")
      .select("product.productId", "product_id")
      .addSelect("product.productCode", "product_code")
      .addSelect("product.productName", "product_name")
      .addSelect("SUM(item.quantity)::bigint", "total_quantity")
      .addSelect("SUM(item.subtotal)::numeric(14,2)::text", "revenue")
      .where("order.status IN (:...statuses)", { statuses: reportStatuses })
      .andWhere("order.orderDate >= :from", {
        from: jakartaStartOfDay(query.from),
      })
      .andWhere("order.orderDate < :to", {
        to: jakartaEndExclusive(query.to),
      })
      .groupBy("product.productId")
      .addGroupBy("product.productCode")
      .addGroupBy("product.productName")
      .orderBy("SUM(item.quantity)", "DESC")
      .addOrderBy("SUM(item.subtotal)", "DESC")
      .take(Math.min(query.limit, 100))
      .getRawMany<TopProductReportRow>()) as TopProductReportRow[];
    res.status(200).json(topProductsReportResponse(rows));
  }),
);

export default router;
