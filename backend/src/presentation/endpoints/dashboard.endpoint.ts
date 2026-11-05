import { Router } from "express";
import { IsNull, MoreThanOrEqual } from "typeorm";
import { Order, Product } from "@domain/entities";
import dataSource from "@infrastructure/config/db-context";
import {
  authenticate,
  requirePermission,
} from "@presentation/middleware/shop-auth.middleware";
import { asyncRoute } from "./endpoint-helpers";
import {
  dashboardSummaryResponse,
  type DashboardSummary,
} from "@application/models/response/dashboard.response";

const router = Router();
router.use(authenticate, requirePermission("dashboard.view"));
router.get(
  "/summary",
  asyncRoute(async (_req, res) => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(now);
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    if (!year || !month) {
      throw new Error(
        "Unable to determine the current Jakarta calendar month.",
      );
    }
    const monthStart = new Date(`${year}-${month}-01T00:00:00.000+07:00`);

    const [orders, products] = await Promise.all([
      dataSource.getRepository(Order).find({
        where: { orderDate: MoreThanOrEqual(monthStart) },
        select: { orderId: true, status: true, totalAmount: true },
      }),
      dataSource.getRepository(Product).find({
        where: { deletedAt: IsNull() },
        select: { productId: true, stock: true, lowStockThreshold: true },
      }),
    ]);

    const paidStatuses = new Set(["PAID", "SHIPPED", "COMPLETED"]);
    const paidOrders = orders.filter((order) => paidStatuses.has(order.status));
    const revenueCents = paidOrders.reduce((total, order) => {
      const [whole, fraction = ""] = order.totalAmount.split(".");
      return total + BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
    }, 0n);
    const data: DashboardSummary = {
      total_orders: orders.length,
      pending_orders: orders.filter((order) => order.status === "PENDING")
        .length,
      paid_orders: paidOrders.length,
      revenue: `${revenueCents / 100n}.${String(revenueCents % 100n).padStart(2, "0")}`,
      active_products: products.length,
      low_stock_products: products.filter(
        (product) => product.stock < product.lowStockThreshold,
      ).length,
    };

    res.status(200).json(dashboardSummaryResponse(data));
  }),
);
export default router;
