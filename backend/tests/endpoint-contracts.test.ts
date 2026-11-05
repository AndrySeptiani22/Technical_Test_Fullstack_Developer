import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response } from "express";
import authRouter from "@presentation/endpoints/auth.endpoint";
import customersRouter from "@presentation/endpoints/customers.endpoint";
import dashboardRouter from "@presentation/endpoints/dashboard.endpoint";
import ordersRouter from "@presentation/endpoints/orders.endpoint";
import productsRouter from "@presentation/endpoints/products.endpoint";
import reportsRouter from "@presentation/endpoints/reports.endpoint";
import {
  ApiError,
  getAuth,
  requireAdmin,
  requirePermission,
  type ShopRequest,
} from "@presentation/middleware/shop-auth.middleware";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import {
  asyncRoute,
  currentUserId,
  gridListFromRequest,
  paginationFromRequest,
  sendModelResponse,
} from "@presentation/endpoints/endpoint-helpers";
import { ValidationError } from "@application/models/error/application.error";
import { UnauthorizedError } from "@application/models/error/unauthorized.error";
import { BaseResponse } from "@application/models/response/base/base.response";

interface RouteLayer {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: unknown[];
  };
}

interface TestRouter {
  stack: RouteLayer[];
}

function routeManifest(router: unknown): Array<{
  method: string;
  path: string;
  middlewareCount: number;
}> {
  const stack = (router as TestRouter).stack;
  return stack.flatMap((layer) => {
    if (!layer.route) return [];
    return Object.entries(layer.route.methods)
      .filter(([, enabled]) => enabled)
      .map(([method]) => ({
        method: method.toUpperCase(),
        path: layer.route!.path,
        middlewareCount: layer.route!.stack.length,
      }));
  });
}

function expectRoutes(
  router: unknown,
  expected: Array<[string, string]>,
  minimumMiddlewareCount = 1,
): void {
  const actual = routeManifest(router);
  assert.deepEqual(
    actual.map(({ method, path }) => `${method} ${path}`).sort(),
    expected.map(([method, path]) => `${method} ${path}`).sort(),
  );
  assert.ok(actual.every((route) => route.middlewareCount >= minimumMiddlewareCount));
}

test("product endpoints expose every supported route with route middleware", () => {
  expectRoutes(productsRouter, [
    ["GET", "/"],
    ["POST", "/filter"],
    ["GET", "/:id"],
    ["POST", "/"],
    ["PUT", "/:id"],
    ["DELETE", "/:id"],
    ["POST", "/:id/stock-adjustments"],
    ["GET", "/:id/stock-movements"],
  ], 2);
  assert.equal((productsRouter as TestRouter).stack.filter((layer) => !layer.route).length, 1);
});

test("customer endpoints expose list, read, create, update, and delete routes", () => {
  expectRoutes(customersRouter, [
    ["GET", "/"],
    ["POST", "/filter"],
    ["GET", "/:id"],
    ["POST", "/"],
    ["PUT", "/:id"],
    ["DELETE", "/:id"],
  ], 2);
  assert.equal((customersRouter as TestRouter).stack.filter((layer) => !layer.route).length, 1);
});

test("order endpoints expose create/read/list and every state transition", () => {
  expectRoutes(ordersRouter, [
    ["GET", "/"],
    ["POST", "/filter"],
    ["POST", "/"],
    ["GET", "/:id"],
    ["POST", "/:id/pay"],
    ["POST", "/:id/ship"],
    ["POST", "/:id/complete"],
    ["POST", "/:id/cancel"],
    ["GET", "/:id/invoice"],
  ], 2);
  assert.equal((ordersRouter as TestRouter).stack.filter((layer) => !layer.route).length, 1);
});

test("authentication routes expose public login/refresh and protected logout/me", () => {
  expectRoutes(authRouter, [
    ["POST", "/login"],
    ["POST", "/refresh"],
    ["POST", "/logout"],
    ["GET", "/me"],
  ], 2);

  const routes = routeManifest(authRouter);
  const protectedPaths = new Set(["POST /logout", "GET /me"]);
  const stack = (authRouter as TestRouter).stack;
  for (const layer of stack) {
    if (!layer.route) continue;
    const key = `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`;
    if (!protectedPaths.has(key)) continue;
    assert.ok(layer.route.stack.some((middleware) => {
      if (typeof middleware !== "object" || middleware === null) return false;
      return "handle" in middleware &&
        typeof middleware.handle === "function" &&
        middleware.handle.name === "authenticate";
    }));
  }
  assert.equal(routes.length, 4);
});

test("dashboard and reporting endpoints expose their protected routes", () => {
  expectRoutes(dashboardRouter, [["GET", "/summary"]]);
  expectRoutes(reportsRouter, [
    ["GET", "/sales"],
    ["GET", "/top-products"],
  ], 2);
  assert.equal((dashboardRouter as TestRouter).stack.filter((layer) => !layer.route).length, 2);
  assert.equal((reportsRouter as TestRouter).stack.filter((layer) => !layer.route).length, 1);
});

test("permission and administrator guards allow authorized requests and reject others", async () => {
  const auth = {
    userId: "user-1",
    email: "user@example.com",
    name: "User",
    roleCode: "cashier",
    permissions: ["products.view"],
  };
  const request = (value?: ShopRequest["auth"]): Request =>
    ({ auth: value }) as unknown as Request;

  assert.equal(getAuth(request(auth)), auth);
  assert.throws(() => getAuth(request()), (error: unknown) =>
    error instanceof ApiError && error.status === 401,
  );

  const runGuard = (guard: (req: Request, res: Response, next: (error?: unknown) => void) => void, req: Request) =>
    new Promise<unknown>((resolve) => {
      guard(req, {} as Response, (error?: unknown) => resolve(error));
    });

  assert.equal(await runGuard(requirePermission("products.view"), request(auth)), undefined);
  const denied = await runGuard(requirePermission("products.delete"), request(auth));
  assert.ok(denied instanceof ApiError);
  assert.equal((denied as ApiError).status, 403);
  assert.equal(await runGuard(requireAdmin, request({ ...auth, roleCode: "admin" })), undefined);
  const notAdmin = await runGuard(requireAdmin, request(auth));
  assert.ok(notAdmin instanceof ApiError);
  assert.equal((notAdmin as ApiError).status, 403);
  assert.ok(await runGuard(requireAdmin, request()) instanceof ApiError);
});

test("pagination helper applies defaults, aliases, caps, and endpoint-specific restrictions", () => {
  const query = (value: Record<string, unknown>) =>
    ({ query: value }) as unknown as Request;
  assert.deepEqual(paginationFromRequest(query({})), {
    page: 1,
    limit: 20,
    search: undefined,
    sortBy: undefined,
    sortOrder: "ASC",
    filters: [],
  });

  assert.deepEqual(paginationFromRequest(query({
    page: "3",
    pageSize: "200",
    search: "mouse",
    sort_by: "price",
    sort_order: "desc",
  }), {
    allowedSortBy: ["price"],
    allowSearch: true,
  }), {
    page: 3,
    limit: 100,
    search: "mouse",
    sortBy: "price",
    sortOrder: "DESC",
    filters: [],
  });
  assert.deepEqual(
    paginationFromRequest(
      query({
        filters: JSON.stringify([
          { field: "stock", operator: "greater_than", value: "5" },
        ]),
      }),
      { allowedFilters: { stock: "number" } },
    ).filters,
    [{ field: "stock", operator: "greater_than", value: "5" }],
  );

  assert.throws(
    () => paginationFromRequest(query({ sort_by: "unsupported" }), {
      allowedSortBy: ["price"],
    }),
    (error: unknown) => error instanceof ValidationError && error.errors?.sort_by !== undefined,
  );
  assert.throws(
    () => paginationFromRequest(query({ search: "mouse" }), { allowSearch: false }),
    ValidationError,
  );
  assert.throws(
    () =>
      paginationFromRequest(
        query({
          filters: JSON.stringify([
            { field: "internal_field", operator: "equals", value: "x" },
          ]),
        }),
        { allowedFilters: { stock: "number" } },
      ),
    ValidationError,
  );
  assert.throws(
    () => paginationFromRequest(query({ sort_order: "DESC" }), {
      allowSorting: false,
    }),
    ValidationError,
  );
  assert.throws(() => paginationFromRequest(query({ limit: "0" })), ValidationError);
});

test("grid list helper validates POST body pagination, sort, search, and filters", () => {
  const request = (body: Record<string, unknown>) =>
    ({ body }) as unknown as Request;
  assert.deepEqual(
    gridListFromRequest(
      request({
        page: 2,
        limit: 25,
        search: "mouse",
        sort_by: "productName",
        sort_order: "desc",
        filters: [{ field: "stock", operator: "greater_than", value: "5" }],
      }),
      {
        allowedSortBy: ["productName"],
        allowSearch: true,
        allowedFilters: { stock: "number" },
      },
    ),
    {
      page: 2,
      limit: 25,
      all: false,
      search: "mouse",
      sortBy: "productName",
      sortOrder: "DESC",
      filters: [{ field: "stock", operator: "greater_than", value: "5" }],
    },
  );
  assert.deepEqual(gridListFromRequest(request({}), {}), {
    page: 1,
    limit: 10,
    all: false,
    search: undefined,
    sortBy: undefined,
    sortOrder: "ASC",
    filters: [],
  });
  assert.deepEqual(gridListFromRequest(request({ limit: "all" }), {}), {
    page: 1,
    limit: 100,
    all: true,
    search: undefined,
    sortBy: undefined,
    sortOrder: "ASC",
    filters: [],
  });
  assert.throws(
    () =>
      gridListFromRequest(
        request({
          filters: [{ field: "unknown", operator: "equals", value: "x" }],
        }),
        { allowedFilters: { stock: "number" } },
      ),
    ValidationError,
  );
  assert.throws(
    () =>
      gridListFromRequest(request({ sort_by: "unsupported" }), {
        allowedSortBy: ["productName"],
      }),
    ValidationError,
  );
});

test("current-user helper distinguishes optional and required context", () => {
  assert.throws(() => currentUserId(), UnauthorizedError);
  assert.equal(currentUserId(false), null);
  HTTPContextAccessor.run({
    userId: "user-1",
    email: "user@example.com",
    permissions: [],
  }, () => {
    assert.equal(currentUserId(), "user-1");
    assert.equal(currentUserId(false), "user-1");
  });
});

test("async route forwards rejected handler errors to Express", async () => {
  const expected = new Error("handler failed");
  let received: unknown;
  const handler = asyncRoute(async () => {
    throw expected;
  });
  handler(
    {} as Request,
    {} as Response,
    (error?: unknown) => {
      received = error;
    },
  );
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(received, expected);
});

test("model response helper uses the model HTTP status and returns the response", () => {
  const model = new BaseResponse("accepted", 202);
  const response = {
    statusCode: 0,
    payload: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.payload = payload;
      return this;
    },
  };
  const result = sendModelResponse(response as unknown as Response, model);
  assert.equal(response.statusCode, 202);
  assert.equal(response.payload, model);
  assert.equal(result, response);
});
