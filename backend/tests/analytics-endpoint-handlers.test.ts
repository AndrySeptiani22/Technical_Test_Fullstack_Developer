import assert from "node:assert/strict";
import test from "node:test";
import { Order, OrderItem, Product } from "@domain/entities";
import dataSource from "@infrastructure/config/db-context";
import dashboardRouter from "@presentation/endpoints/dashboard.endpoint";
import reportsRouter from "@presentation/endpoints/reports.endpoint";
import { invokeEndpoint } from "./endpoint-test-helpers";

const userContext = {
  userId: "user-1",
  email: "admin@example.com",
  permissions: [],
};

async function withRepositories<T>(
  repositories: Map<object, unknown>,
  action: () => Promise<T>,
): Promise<T> {
  Object.defineProperty(dataSource, "getRepository", {
    configurable: true,
    value: (entity: object) => {
      const repository = repositories.get(entity);
      if (!repository) throw new Error("Unexpected repository requested.");
      return repository;
    },
  });

  try {
    return await action();
  } finally {
    Reflect.deleteProperty(dataSource, "getRepository");
  }
}

function queryBuilder(rows: unknown[], onTake: (limit: number) => void = () => {}) {
  const builder = {
    select: () => builder,
    addSelect: () => builder,
    innerJoin: () => builder,
    where: () => builder,
    andWhere: () => builder,
    setParameter: () => builder,
    groupBy: () => builder,
    addGroupBy: () => builder,
    orderBy: () => builder,
    addOrderBy: () => builder,
    take: (limit: number) => {
      onTake(limit);
      return builder;
    },
    getRawMany: async () => rows,
  };
  return builder;
}

test("dashboard endpoint summarizes paid revenue, order statuses, and low stock", async () => {
  await withRepositories(new Map<object, unknown>([
    [Order, {
      find: async () => [
        { orderId: "1", status: "PENDING", totalAmount: "100.00" },
        { orderId: "2", status: "PAID", totalAmount: "12.30" },
        { orderId: "3", status: "SHIPPED", totalAmount: "7.70" },
        { orderId: "4", status: "CANCELLED", totalAmount: "500.00" },
      ],
    }],
    [Product, {
      find: async () => [
        { productId: "1", stock: 2, lowStockThreshold: 5 },
        { productId: "2", stock: 5, lowStockThreshold: 5 },
      ],
    }],
  ]), async () => {
    const result = await invokeEndpoint(
      dashboardRouter,
      "get",
      "/summary",
      {},
      userContext,
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual((result.body as { data: unknown }).data, {
      total_orders: 4,
      pending_orders: 1,
      paid_orders: 2,
      revenue: "20.00",
      active_products: 2,
      low_stock_products: 1,
    });
  });
});

test("sales report endpoint builds a date-grouped report response", async () => {
  const rows = [
    { period: "2026-01-01T00:00:00.000Z", total_orders: 2, revenue: "200.00" },
  ];
  await withRepositories(new Map<object, unknown>([
    [Order, { createQueryBuilder: () => queryBuilder(rows) }],
  ]), async () => {
    const result = await invokeEndpoint(
      reportsRouter,
      "get",
      "/sales",
      {
        query: {
          from: "2026-01-01",
          to: "2026-01-31",
          group_by: "month",
        },
      },
      userContext,
    );
    assert.equal(result.statusCode, 200);
    assert.deepEqual((result.body as { data: unknown }).data, rows);
  });
});

test("top-products report caps the requested limit and returns query rows", async () => {
  const rows = [
    {
      product_id: "1",
      product_code: "PRD-1",
      product_name: "Mouse",
      total_quantity: "5",
      revenue: "100.00",
    },
  ];
  let appliedLimit = 0;
  const repository = {
    createQueryBuilder: () => queryBuilder(rows, (limit) => {
      appliedLimit = limit;
    }),
  };
  await withRepositories(new Map<object, unknown>([
    [OrderItem, repository],
  ]), async () => {
    const result = await invokeEndpoint(
      reportsRouter,
      "get",
      "/top-products",
      { query: { from: "2026-01-01", to: "2026-01-31", limit: "101" } },
      userContext,
    );
    assert.equal(result.statusCode, 200);
    assert.equal(appliedLimit, 100);
    assert.deepEqual((result.body as { data: unknown }).data, rows);
  });
});
