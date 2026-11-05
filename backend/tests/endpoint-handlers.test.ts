import assert from "node:assert/strict";
import test from "node:test";
import { AuthUseCase } from "@application/use-cases/auth/auth.use-case";
import { CustomerUseCase } from "@application/use-cases/customers/customer.use-case";
import { OrderUseCase } from "@application/use-cases/orders/order.use-case";
import { ProductUseCase } from "@application/use-cases/products/product.use-case";
import { Customer } from "@domain/entities/customer.entity";
import { Order } from "@domain/entities/order.entity";
import { Product } from "@domain/entities/product.entity";
import authRouter from "@presentation/endpoints/auth.endpoint";
import customersRouter from "@presentation/endpoints/customers.endpoint";
import ordersRouter from "@presentation/endpoints/orders.endpoint";
import productsRouter from "@presentation/endpoints/products.endpoint";
import {
  NotFoundError,
  ValidationError,
} from "@application/models/error/application.error";
import {
  invokeEndpoint,
  stubMethod,
  type EndpointRequest,
} from "./endpoint-test-helpers";

const userContext = {
  userId: "user-1",
  email: "cashier@example.com",
  permissions: [],
};
const customerId = "550e8400-e29b-41d4-a716-446655440000";

function productFixture(): Product {
  return Object.assign(new Product(), {
    productId: "17",
    productCode: "PRD-017",
    productName: "Wireless Mouse",
    stock: 8,
    price: "199000.00",
    lowStockThreshold: 2,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    orderItems: [],
    stockMovements: [],
  });
}

function customerFixture(): Customer {
  return Object.assign(new Customer(), {
    customerId,
    customerName: "Ayu Putri",
    customerAddress: "Jakarta",
    gender: "FEMALE" as const,
    birthDate: "1995-06-15",
    phone: "+628123456789",
    email: "ayu@example.com",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    orders: [],
  });
}

function orderFixture(): Order {
  return Object.assign(new Order(), {
    orderId: "42",
    orderNumber: "INV-20260101-0042",
    customerId,
    createdBy: userContext.userId,
    status: "PAID" as const,
    totalAmount: "398000.00",
    orderDate: new Date("2026-01-01T00:00:00.000Z"),
    paidAt: new Date("2026-01-01T00:10:00.000Z"),
    shippedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:10:00.000Z"),
    items: [],
    history: [],
  });
}

test("product endpoint handlers cover successful CRUD and stock paths", async () => {
  const product = productFixture();
  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const restores = [
    stubMethod(ProductUseCase.prototype, "list", async () => ({ items: [product], meta })),
    stubMethod(ProductUseCase.prototype, "getById", async (id) => id === "17" ? product : null),
    stubMethod(ProductUseCase.prototype, "create", async (input) => Object.assign(productFixture(), input)),
    stubMethod(ProductUseCase.prototype, "update", async (_id, input) => Object.assign(productFixture(), input)),
    stubMethod(ProductUseCase.prototype, "delete", async () => undefined),
    stubMethod(ProductUseCase.prototype, "adjustStock", async (_id, delta) =>
      Object.assign(productFixture(), { stock: product.stock + delta }),
    ),
    stubMethod(ProductUseCase.prototype, "movements", async () => ({ items: [], meta })),
  ];

  try {
    const list = await invokeEndpoint(productsRouter, "get", "/", {
      query: { page: "1", limit: "20", sort_by: "productName" },
    });
    assert.equal(list.statusCode, 200);
    assert.equal((list.body as { data: unknown[] }).data.length, 1);
    const filteredList = await invokeEndpoint(productsRouter, "post", "/filter", {
      body: {
        page: 1,
        limit: 20,
        filters: [{ field: "stock", operator: "greater_than", value: "5" }],
      },
    });
    assert.equal(filteredList.statusCode, 200);

    const get = await invokeEndpoint(productsRouter, "get", "/:id", { params: { id: "17" } });
    assert.equal(get.statusCode, 200);
    assert.equal((get.body as { data: { id: string } }).data.id, "17");

    const created = await invokeEndpoint(productsRouter, "post", "/", {
      body: { product_code: "PRD-018", product_name: "Keyboard", price: "100.00" },
    });
    assert.equal(created.statusCode, 201);

    const updated = await invokeEndpoint(productsRouter, "put", "/:id", {
      params: { id: "17" },
      body: { product_name: "Updated mouse" },
    });
    assert.equal(updated.statusCode, 200);

    const deleted = await invokeEndpoint(productsRouter, "delete", "/:id", {
      params: { id: "17" },
    });
    assert.equal(deleted.statusCode, 204);

    const adjusted = await invokeEndpoint(productsRouter, "post", "/:id/stock-adjustments", {
      params: { id: "17" },
      body: { quantity_change: -1, note: "Damaged" },
    }, userContext);
    assert.equal(adjusted.statusCode, 200);

    const movements = await invokeEndpoint(productsRouter, "get", "/:id/stock-movements", {
      params: { id: "17" },
      query: { page: "1" },
    });
    assert.equal(movements.statusCode, 200);
    assert.deepEqual((movements.body as { data: unknown[] }).data, []);

    await assert.rejects(
      invokeEndpoint(productsRouter, "get", "/:id", { params: { id: "18" } }),
      NotFoundError,
    );
    await assert.rejects(
      invokeEndpoint(productsRouter, "post", "/", { body: { product_name: "Missing fields" } }),
      ValidationError,
    );
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("customer endpoint handlers cover successful CRUD and not-found validation paths", async () => {
  const customer = customerFixture();
  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const restores = [
    stubMethod(CustomerUseCase.prototype, "list", async () => ({ items: [customer], meta })),
    stubMethod(CustomerUseCase.prototype, "getById", async (id) => id === customerId ? customer : null),
    stubMethod(CustomerUseCase.prototype, "create", async () => customer),
    stubMethod(CustomerUseCase.prototype, "update", async () => customer),
    stubMethod(CustomerUseCase.prototype, "delete", async () => undefined),
  ];

  try {
    assert.equal((await invokeEndpoint(customersRouter, "get", "/")).statusCode, 200);
    assert.equal((await invokeEndpoint(customersRouter, "post", "/filter", {
      body: { page: 1, filters: [{ field: "customer_name", operator: "contains", value: "Ayu" }] },
    })).statusCode, 200);
    assert.equal((await invokeEndpoint(customersRouter, "get", "/:id", {
      params: { id: customerId },
    })).statusCode, 200);
    assert.equal((await invokeEndpoint(customersRouter, "post", "/", {
      body: { customer_name: "Ayu", customer_address: "Jakarta" },
    })).statusCode, 201);
    assert.equal((await invokeEndpoint(customersRouter, "put", "/:id", {
      params: { id: customerId },
      body: { email: "new@example.com" },
    })).statusCode, 200);
    assert.equal((await invokeEndpoint(customersRouter, "delete", "/:id", {
      params: { id: customerId },
    })).statusCode, 204);

    await assert.rejects(
      invokeEndpoint(customersRouter, "get", "/:id", { params: { id: "missing" } }),
      ValidationError,
    );
    await assert.rejects(
      invokeEndpoint(customersRouter, "get", "/:id", {
        params: { id: "not-a-uuid" },
      }),
      ValidationError,
    );
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("auth endpoint handlers cover login, refresh, logout, and current-user results", async () => {
  const user = {
    userId: userContext.userId,
    name: "Cashier",
    email: userContext.email,
    roleCode: "cashier",
    permissions: ["orders.view"],
  };
  const tokenResult = {
    accessToken: "access-token",
    refreshToken: "r".repeat(32),
    tokenType: "Bearer" as const,
    expiresIn: 3600,
    user,
  };
  const restores = [
    stubMethod(AuthUseCase.prototype, "login", async () => tokenResult),
    stubMethod(AuthUseCase.prototype, "refresh", async () => tokenResult),
    stubMethod(AuthUseCase.prototype, "logout", async () => undefined),
    stubMethod(AuthUseCase.prototype, "me", async () => user),
  ];

  try {
    const login = await invokeEndpoint(authRouter, "post", "/login", {
      body: { email: user.email, password: "password" },
    });
    assert.equal(login.statusCode, 200);
    assert.deepEqual((login.body as { data: { user: unknown } }).data.user, user);

    assert.equal((await invokeEndpoint(authRouter, "post", "/refresh", {
      body: { refresh_token: tokenResult.refreshToken },
    })).statusCode, 200);

    assert.equal((await invokeEndpoint(authRouter, "post", "/logout", {
      body: {},
    })).statusCode, 200);
    assert.equal((await invokeEndpoint(authRouter, "post", "/logout", {
      body: { refresh_token: tokenResult.refreshToken },
    })).statusCode, 200);

    const me = await invokeEndpoint(authRouter, "get", "/me", {
      auth: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        roleCode: user.roleCode,
        permissions: user.permissions,
      },
    });
    assert.equal(me.statusCode, 200);
    assert.deepEqual((me.body as { data: unknown }).data, user);

    await assert.rejects(
      invokeEndpoint(authRouter, "post", "/login", { body: { email: "bad" } }),
      ValidationError,
    );
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});

test("order endpoint handlers cover listing, idempotency, transitions, invoice, and failures", async () => {
  const order = orderFixture();
  const meta = { page: 1, per_page: 20, total: 1, total_pages: 1 };
  const createResult = {
    order,
    replayed: false,
    responseBody: undefined,
    responseStatus: 201,
  };
  const transitionActions: string[] = [];
  const restores = [
    stubMethod(OrderUseCase.prototype, "list", async () => ({ items: [order], meta })),
    stubMethod(OrderUseCase.prototype, "create", async () => createResult),
    stubMethod(OrderUseCase.prototype, "getById", async (id) => id === "42" ? order : null),
    stubMethod(OrderUseCase.prototype, "transition", async (input) => {
      transitionActions.push(input.action);
      return order;
    }),
  ];

  try {
    assert.equal((await invokeEndpoint(ordersRouter, "get", "/", {
      query: { status: "pending" },
    })).statusCode, 200);
    assert.equal((await invokeEndpoint(ordersRouter, "post", "/filter", {
      body: {
        page: 1,
        filters: [{ field: "status", operator: "equals", value: "PAID" }],
      },
    })).statusCode, 200);

    const createRequest = {
      body: { customer_id: customerId, items: [{ product_id: 17, quantity: 2 }] },
      get: (name: string) => name.toLowerCase() === "idempotency-key"
        ? "50cce154-6d63-4dc4-a7f9-41b8e4edaf57"
        : undefined,
      auth: {
        userId: userContext.userId,
        email: userContext.email,
        name: "Cashier",
        roleCode: "cashier",
        permissions: ["orders.create"],
      },
    } satisfies EndpointRequest;
    const create = await invokeEndpoint(ordersRouter, "post", "/", createRequest);
    assert.equal(create.statusCode, 201);
    assert.equal(create.headers["idempotency-replayed"], "false");

    assert.equal((await invokeEndpoint(ordersRouter, "get", "/:id", {
      params: { id: "42" },
    })).statusCode, 200);
    await assert.rejects(
      invokeEndpoint(ordersRouter, "get", "/:id", { params: { id: "43" } }),
      NotFoundError,
    );

    for (const action of ["pay", "ship", "complete", "cancel"] as const) {
      const body = action === "cancel" ? { cancel_reason: "Requested" } : {};
      const result = await invokeEndpoint(ordersRouter, "post", `/:id/${action}`, {
        params: { id: "42" },
        body,
        auth: {
          userId: userContext.userId,
          email: userContext.email,
          name: "Cashier",
          roleCode: "cashier",
          permissions: [`orders.${action}`],
        },
      });
      assert.equal(result.statusCode, 200);
    }
    assert.deepEqual(transitionActions, ["pay", "ship", "complete", "cancel"]);

    const invoice = await invokeEndpoint(ordersRouter, "get", "/:id/invoice", {
      params: { id: "42" },
    });
    assert.equal(invoice.statusCode, 200);
    assert.equal(invoice.contentType, "html");
    assert.equal(invoice.headers["content-disposition"], 'attachment; filename="INV-20260101-0042.html"');

    await assert.rejects(
      invokeEndpoint(ordersRouter, "post", "/", { body: {} }),
      ValidationError,
    );
  } finally {
    restores.reverse().forEach((restore) => restore());
  }
});
