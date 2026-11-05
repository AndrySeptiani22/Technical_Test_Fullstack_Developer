import type { JsonObject } from "swagger-ui-express";

const ok = (message: string, data?: unknown, meta?: unknown) => ({
  success: true,
  message,
  ...(data === undefined ? {} : { data }),
  ...(meta === undefined ? {} : { meta }),
});

const error = (code: string, message: string, errors?: unknown) => ({
  success: false,
  message,
  error: { code, message },
  ...(errors === undefined ? {} : { errors }),
});

const jsonResponse = (description: string, example: unknown) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/ApiResponse" },
      example,
    },
  },
});

const errors = {
  "400": jsonResponse(
    "Invalid request.",
    error("VALIDATION_ERROR", "Request validation failed.", {
      page: ["Invalid value."],
    }),
  ),
  "401": jsonResponse(
    "Authentication is missing or invalid.",
    error("UNAUTHORIZED", "Authentication is required."),
  ),
  "403": jsonResponse(
    "The authenticated user lacks permission.",
    error("FORBIDDEN", "You do not have permission to perform this action."),
  ),
  "404": jsonResponse(
    "The requested resource was not found.",
    error("NOT_FOUND", "Resource not found."),
  ),
  "409": jsonResponse(
    "The request conflicts with current state.",
    error("CONFLICT", "The request conflicts with the current resource state."),
  ),
  "422": jsonResponse(
    "The request is valid JSON but cannot be processed.",
    error("VALIDATION_ERROR", "Request validation failed."),
  ),
};

const bearer = [{ BearerAuth: [] }];
const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description:
    "Positive signed 64-bit resource identifier, represented as a decimal string.",
  schema: {
    type: "string",
    minLength: 1,
    maxLength: 19,
    pattern: "^[1-9][0-9]*$",
  },
  example: "1",
};

const paginationParameters = [
  {
    name: "page",
    in: "query",
    description: "1-based page number.",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "limit",
    in: "query",
    description:
      "Requested results per page. Values above 100 are capped by the API.",
    schema: { type: "integer", minimum: 1, default: 20 },
  },
  {
    name: "pageSize",
    in: "query",
    description: "Legacy alias for limit.",
    schema: { type: "integer", minimum: 1, maximum: 100 },
  },
  {
    name: "filters",
    in: "query",
    description:
      "URL-encoded JSON array of field/operator/value filters. Multiple filters are combined with AND; fields depend on the resource.",
    schema: { type: "string", maxLength: 8000 },
    example: '[{"field":"stock","operator":"greater_than","value":"5"}]',
  },
  {
    name: "search",
    in: "query",
    description: "Search term, where supported.",
    schema: { type: "string", maxLength: 200 },
  },
  {
    name: "sort_by",
    in: "query",
    description: "Allowed sort field; fields differ by resource.",
    schema: { type: "string" },
  },
  {
    name: "sort_order",
    in: "query",
    schema: { type: "string", enum: ["ASC", "DESC"], default: "ASC" },
  },
];

const requestBody = (schema: string, example: unknown, required = true) => ({
  required,
  content: {
    "application/json": {
      schema: { $ref: `#/components/schemas/${schema}` },
      example,
    },
  },
});

const gridListRequestBody = (exampleFilter: unknown) => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          page: { type: "integer", minimum: 1, default: 1 },
          limit: {
            oneOf: [
              { type: "integer", minimum: 1, maximum: 100 },
              { type: "string", const: "all" },
            ],
            default: 10,
          },
          pageSize: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            description: "Legacy alias for limit.",
          },
          search: { type: "string", maxLength: 200 },
          sort_by: { type: "string", maxLength: 50 },
          sort_order: { type: "string", enum: ["ASC", "DESC"], default: "ASC" },
          filters: {
            type: "array",
            maxItems: 20,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["field", "operator"],
              properties: {
                field: { type: "string", minLength: 1, maxLength: 50 },
                operator: {
                  type: "string",
                  enum: [
                    "equals",
                    "not_equals",
                    "contains",
                    "not_contains",
                    "greater_than",
                    "greater_or_equal",
                    "less_than",
                    "less_or_equal",
                    "starts_with",
                    "ends_with",
                    "is_empty",
                    "is_not_empty",
                    "in",
                  ],
                },
                value: { type: "string", maxLength: 200 },
                values: {
                  type: "array",
                  minItems: 1,
                  maxItems: 5,
                  items: { type: "string", minLength: 1, maxLength: 50 },
                },
              },
            },
          },
        },
      },
      example: {
        page: 1,
        limit: 20,
        sort_by: "productName",
        sort_order: "ASC",
        filters: [exampleFilter],
      },
    },
  },
});

const catalogPaginationParameters = (sortFields: string[]) =>
  paginationParameters.map((parameter) =>
    parameter.name === "sort_by"
      ? {
          ...parameter,
          description: "Sort by one of the supported fields.",
          schema: { type: "string", enum: sortFields },
        }
      : parameter,
  );

const successResponses = (
  description: string,
  example: unknown,
  status = "200",
  additionalResponses: Record<string, unknown> = {},
) => ({
  [status]: jsonResponse(description, example),
  ...errors,
  ...additionalResponses,
});

const productExample = {
  id: "1",
  product_code: "PRD-001",
  product_name: "Wireless Mouse",
  stock: 25,
  price: "199000.00",
  low_stock_threshold: 5,
  created_at: "2026-11-05T07:00:00.000Z",
  updated_at: "2026-11-05T07:00:00.000Z",
};
const customerExample = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  customer_name: "Ayu Putri",
  customer_address: "Jakarta",
  gender: "FEMALE",
  birth_date: "1995-06-15",
  phone: "+628123456789",
  email: "ayu@example.com",
  created_at: "2026-11-05T07:00:00.000Z",
  updated_at: "2026-11-05T07:00:00.000Z",
};
const orderExample = {
  id: "42",
  order_number: "INV-20261105-0042",
  customer_id: "550e8400-e29b-41d4-a716-446655440000",
  created_by: "cd1e6b23-cd04-4fe9-8c03-9d8b27b35731",
  status: "PENDING",
  total_amount: "398000.00",
  order_date: "2026-11-05T07:00:00.000Z",
  paid_at: null,
  shipped_at: null,
  completed_at: null,
  cancelled_at: null,
  cancel_reason: null,
  items: [
    {
      id: "81",
      product_id: "1",
      quantity: 2,
      unit_price: "199000.00",
      subtotal: "398000.00",
    },
  ],
  history: [
    {
      from_status: null,
      to_status: "PENDING",
      reason: "Order created",
      created_by: "cd1e6b23-cd04-4fe9-8c03-9d8b27b35731",
      created_at: "2026-11-05T07:00:00.000Z",
    },
  ],
  created_at: "2026-11-05T07:00:00.000Z",
  updated_at: "2026-11-05T07:00:00.000Z",
};

const openApiDocument: JsonObject = {
  openapi: "3.0.3",
  info: {
    title: "Azatech Shop API",
    version: "1.0.0",
    description:
      "Shop and order-management API. Business endpoints are under /api; the root and versioned health checks are public. Authenticate with the JWT access token returned by login using the Authorize button. Permission requirements are listed in endpoint summaries. List GET endpoints accept filters as URL-encoded JSON; grid /filter endpoints accept filters as JSON arrays in their request bodies.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Products" },
    { name: "Customers" },
    { name: "Orders" },
    { name: "Dashboard" },
    { name: "Reports" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Root health check",
        responses: {
          "200": jsonResponse("Database is available.", {
            status: "ok",
            checks: { database: "ok" },
            timestamp: "2026-11-05T07:00:00.000Z",
          }),
          "503": jsonResponse("Database check failed.", {
            status: "error",
            checks: { database: "error" },
            timestamp: "2026-11-05T07:00:00.000Z",
          }),
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Versioned health check",
        responses: {
          "200": jsonResponse(
            "Database is available.",
            ok("OK", {
              status: "ok",
              checks: { database: "ok" },
              timestamp: "2026-11-05T07:00:00.000Z",
            }),
          ),
          "503": jsonResponse("Database check failed.", {
            success: false,
            message: "Health check failed.",
            data: {
              status: "error",
              checks: { database: "error" },
              timestamp: "2026-11-05T07:00:00.000Z",
            },
          }),
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        description:
          "Public endpoint. Rate limited to 10 attempts per 15 minutes.",
        requestBody: requestBody("LoginRequest", {
          email: "admin@example.com",
          password: "your-password",
        }),
        responses: successResponses(
          "Returns an access token and refresh token.",
          ok("Login successful.", {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example",
            refreshToken: "opaque-refresh-token",
            tokenType: "Bearer",
            expiresIn: 3600,
            user: {
              userId: "cd1e6b23-cd04-4fe9-8c03-9d8b27b35731",
              name: "Admin",
              email: "admin@example.com",
              roleCode: "admin",
              permissions: ["products.view", "orders.view"],
            },
          }),
          "200",
          {
            "429": jsonResponse(
              "The login request rate limit was exceeded.",
              error(
                "RATE_LIMITED",
                "Too many requests. Please try again later.",
              ),
            ),
          },
        ),
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description: "Public endpoint. Rate limited to 30 attempts per minute.",
        requestBody: requestBody("RefreshRequest", {
          refresh_token: "opaque-refresh-token-from-login",
        }),
        responses: successResponses(
          "Returns rotated access and refresh tokens.",
          ok("Token refreshed.", {
            accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example",
            refreshToken: "rotated-opaque-refresh-token",
            tokenType: "Bearer",
            expiresIn: 3600,
            user: {
              userId: "cd1e6b23-cd04-4fe9-8c03-9d8b27b35731",
              name: "Admin",
              email: "admin@example.com",
              roleCode: "admin",
              permissions: ["products.view", "orders.view"],
            },
          }),
          "200",
          {
            "429": jsonResponse(
              "The token refresh rate limit was exceeded.",
              error(
                "RATE_LIMITED",
                "Too many requests. Please try again later.",
              ),
            ),
          },
        ),
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        security: bearer,
        requestBody: requestBody(
          "LogoutRequest",
          { refresh_token: "opaque-refresh-token-from-login" },
          false,
        ),
        responses: successResponses(
          "Revokes the optional refresh token.",
          ok("Logout successful."),
        ),
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        security: bearer,
        responses: successResponses(
          "Current user and permissions.",
          ok("OK", {
            userId: "cd1e6b23-cd04-4fe9-8c03-9d8b27b35731",
            name: "Admin",
            email: "admin@example.com",
            roleCode: "admin",
            permissions: ["products.view", "orders.view"],
          }),
        ),
      },
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "List products (products.view)",
        security: bearer,
        parameters: catalogPaginationParameters([
          "productName",
          "productCode",
          "price",
          "stock",
          "createdAt",
        ]),
        responses: successResponses(
          "Paginated products.",
          ok("OK", [productExample], {
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
          }),
        ),
      },
      post: {
        tags: ["Products"],
        summary: "Create product (products.create)",
        security: bearer,
        requestBody: requestBody("ProductCreateRequest", {
          product_code: "PRD-001",
          product_name: "Wireless Mouse",
          stock: 25,
          price: "199000.00",
          low_stock_threshold: 5,
        }),
        responses: successResponses(
          "Product created.",
          ok("Product created.", productExample),
          "201",
        ),
      },
    },
    "/api/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product (products.view)",
        security: bearer,
        parameters: [idParameter],
        responses: successResponses("Product.", ok("OK", productExample)),
      },
      put: {
        tags: ["Products"],
        summary: "Update product (products.update)",
        security: bearer,
        parameters: [idParameter],
        requestBody: requestBody("ProductUpdateRequest", {
          product_name: "Wireless Mouse Pro",
          price: "219000.00",
        }),
        responses: successResponses(
          "Product updated.",
          ok("Product updated.", {
            ...productExample,
            product_name: "Wireless Mouse Pro",
          }),
        ),
      },
      delete: {
        tags: ["Products"],
        summary: "Soft-delete product (products.delete)",
        security: bearer,
        parameters: [idParameter],
        responses: {
          "204": { description: "Product deleted." },
          ...errors,
        },
      },
    },
    "/api/products/filter": {
      post: {
        tags: ["Products"],
        summary: "Filter and list products (products.view)",
        security: bearer,
        requestBody: gridListRequestBody({
          field: "stock",
          operator: "greater_than",
          value: "5",
        }),
        responses: successResponses(
          "Filtered and paginated products.",
          ok("OK", [productExample], {
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
          }),
        ),
      },
    },
    "/api/products/{id}/stock-adjustments": {
      post: {
        tags: ["Products"],
        summary: "Adjust product stock (stock.adjust)",
        security: bearer,
        parameters: [idParameter],
        requestBody: requestBody("StockAdjustmentRequest", {
          quantity_change: -2,
          note: "Damaged items",
        }),
        responses: successResponses(
          "Stock adjusted.",
          ok("Stock adjusted.", { ...productExample, stock: 23 }),
        ),
      },
    },
    "/api/products/{id}/stock-movements": {
      get: {
        tags: ["Products"],
        summary: "List stock movements (stock.view_movements)",
        security: bearer,
        parameters: [idParameter, ...paginationParameters.slice(0, 3)],
        responses: successResponses(
          "Paginated stock movements.",
          ok(
            "OK",
            [
              {
                id: "15",
                product_id: "1",
                type: "ADJUSTMENT",
                quantity_change: -2,
                stock_after: 23,
                reference_type: "manual_adjustment",
                reference_id: null,
                note: "Damaged items",
                created_by: "cd1e6b23-cd04-4fe9-8c03-9d8b27b35731",
                created_at: "2026-11-05T07:00:00.000Z",
              },
            ],
            { page: 1, per_page: 20, total: 1, total_pages: 1 },
          ),
        ),
      },
    },
    "/api/customers": {
      get: {
        tags: ["Customers"],
        summary: "List customers (customers.view)",
        security: bearer,
        parameters: catalogPaginationParameters([
          "customerName",
          "createdAt",
          "email",
        ]),
        responses: successResponses(
          "Paginated customers.",
          ok("OK", [customerExample], {
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
          }),
        ),
      },
      post: {
        tags: ["Customers"],
        summary: "Create customer (customers.create)",
        security: bearer,
        requestBody: requestBody("CustomerCreateRequest", {
          customer_name: "Ayu Putri",
          customer_address: "Jakarta",
          gender: "FEMALE",
          birth_date: "1995-06-15",
          phone: "+628123456789",
          email: "ayu@example.com",
        }),
        responses: successResponses(
          "Customer created.",
          ok("Customer created.", customerExample),
          "201",
        ),
      },
    },
    "/api/customers/filter": {
      post: {
        tags: ["Customers"],
        summary: "Filter and list customers (customers.view)",
        security: bearer,
        requestBody: gridListRequestBody({
          field: "customer_name",
          operator: "contains",
          value: "Ayu",
        }),
        responses: successResponses(
          "Filtered and paginated customers.",
          ok("OK", [customerExample], {
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
          }),
        ),
      },
    },
    "/api/customers/{id}": {
      get: {
        tags: ["Customers"],
        summary: "Get customer (customers.view)",
        security: bearer,
        parameters: [
          {
            ...idParameter,
            schema: { type: "string", format: "uuid" },
            example: customerExample.id,
          },
        ],
        responses: successResponses("Customer.", ok("OK", customerExample)),
      },
      put: {
        tags: ["Customers"],
        summary: "Update customer (customers.update)",
        security: bearer,
        parameters: [
          {
            ...idParameter,
            schema: { type: "string", format: "uuid" },
            example: customerExample.id,
          },
        ],
        requestBody: requestBody("CustomerUpdateRequest", {
          customer_address: "Bandung",
        }),
        responses: successResponses(
          "Customer updated.",
          ok("Customer updated.", {
            ...customerExample,
            customer_address: "Bandung",
          }),
        ),
      },
      delete: {
        tags: ["Customers"],
        summary: "Soft-delete customer (customers.delete)",
        security: bearer,
        parameters: [
          {
            ...idParameter,
            schema: { type: "string", format: "uuid" },
            example: customerExample.id,
          },
        ],
        responses: {
          "204": { description: "Customer deleted." },
          ...errors,
        },
      },
    },
    "/api/orders": {
      get: {
        tags: ["Orders"],
        summary: "List orders (orders.view)",
        security: bearer,
        parameters: [
          ...paginationParameters.slice(0, 3),
          {
            name: "sort_by",
            in: "query",
            schema: {
              type: "string",
              enum: [
                "orderNumber",
                "orderDate",
                "status",
                "totalAmount",
                "itemsCount",
              ],
              default: "orderDate",
            },
          },
          {
            name: "sort_order",
            in: "query",
            schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" },
          },
          ...paginationParameters.slice(3, 5),
          {
            name: "status",
            in: "query",
            schema: {
              type: "string",
              enum: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"],
            },
          },
          {
            name: "customer_id",
            in: "query",
            schema: { type: "string", format: "uuid" },
          },
          {
            name: "from",
            in: "query",
            description: "Inclusive Jakarta date, YYYY-MM-DD.",
            schema: { type: "string", format: "date" },
          },
          {
            name: "to",
            in: "query",
            description: "Inclusive Jakarta date, YYYY-MM-DD.",
            schema: { type: "string", format: "date" },
          },
        ],
        responses: successResponses(
          "Paginated orders.",
          ok("OK", [orderExample], {
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
          }),
        ),
      },
      post: {
        tags: ["Orders"],
        summary: "Create order (orders.create)",
        description:
          "Requires an idempotency UUID. Repeating the same key and payload replays the original response. Limited to 30 requests per minute.",
        security: bearer,
        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: { type: "string", format: "uuid" },
            example: "50cce154-6d63-4dc4-a7f9-41b8e4edaf57",
          },
        ],
        requestBody: requestBody("OrderCreateRequest", {
          customer_id: customerExample.id,
          items: [{ product_id: "1", quantity: 2 }],
        }),
        responses: {
          ...successResponses(
            "Order created.",
            ok("Order created.", orderExample),
            "201",
          ),
          "201": {
            ...jsonResponse(
              "Order created.",
              ok("Order created.", orderExample),
            ),
            headers: {
              "Idempotency-Replayed": {
                description: "Whether the response replays an earlier request.",
                schema: { type: "string", enum: ["false"] },
              },
            },
          },
          "200": {
            ...jsonResponse(
              "An idempotent replay of the original response.",
              ok("Order created.", orderExample),
            ),
            headers: {
              "Idempotency-Replayed": {
                description: "Whether the response replays an earlier request.",
                schema: { type: "string", enum: ["true"] },
              },
            },
          },
          "429": jsonResponse(
            "The order creation rate limit was exceeded.",
            error("RATE_LIMITED", "Too many requests. Please try again later."),
          ),
        },
      },
    },
    "/api/orders/filter": {
      post: {
        tags: ["Orders"],
        summary: "Filter and list orders (orders.view)",
        security: bearer,
        requestBody: gridListRequestBody({
          field: "status",
          operator: "in",
          values: ["PAID", "SHIPPED"],
        }),
        responses: successResponses(
          "Filtered and paginated orders.",
          ok("OK", [orderExample], {
            page: 1,
            per_page: 20,
            total: 1,
            total_pages: 1,
          }),
        ),
      },
    },
    "/api/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order (orders.view)",
        security: bearer,
        parameters: [idParameter],
        responses: successResponses("Order.", ok("OK", orderExample)),
      },
    },
    "/api/orders/{id}/pay": {
      post: {
        tags: ["Orders"],
        summary: "Pay order (orders.pay)",
        security: bearer,
        parameters: [idParameter],
        requestBody: requestBody("EmptyRequest", {}, false),
        responses: successResponses(
          "Order paid.",
          ok("Order pay successful.", {
            ...orderExample,
            status: "PAID",
            paid_at: "2026-11-05T07:10:00.000Z",
          }),
        ),
      },
    },
    "/api/orders/{id}/ship": {
      post: {
        tags: ["Orders"],
        summary: "Ship order (orders.ship)",
        security: bearer,
        parameters: [idParameter],
        requestBody: requestBody("EmptyRequest", {}, false),
        responses: successResponses(
          "Order shipped.",
          ok("Order ship successful.", { ...orderExample, status: "SHIPPED" }),
        ),
      },
    },
    "/api/orders/{id}/complete": {
      post: {
        tags: ["Orders"],
        summary: "Complete order (orders.complete)",
        security: bearer,
        parameters: [idParameter],
        requestBody: requestBody("EmptyRequest", {}, false),
        responses: successResponses(
          "Order completed.",
          ok("Order complete successful.", {
            ...orderExample,
            status: "COMPLETED",
          }),
        ),
      },
    },
    "/api/orders/{id}/cancel": {
      post: {
        tags: ["Orders"],
        summary: "Cancel order (orders.cancel)",
        security: bearer,
        parameters: [idParameter],
        requestBody: requestBody("CancelOrderRequest", {
          cancel_reason: "Customer requested cancellation",
        }),
        responses: successResponses(
          "Order cancelled.",
          ok("Order cancel successful.", {
            ...orderExample,
            status: "CANCELLED",
            cancel_reason: "Customer requested cancellation",
          }),
        ),
      },
    },
    "/api/orders/{id}/invoice": {
      get: {
        tags: ["Orders"],
        summary: "Download invoice HTML (orders.invoice)",
        security: bearer,
        parameters: [idParameter],
        responses: {
          "200": {
            description: "HTML invoice document.",
            content: {
              "text/html": {
                schema: { type: "string" },
                example:
                  '<!doctype html><html lang="en"><title>INV-20261105-0042</title>...</html>',
              },
            },
          },
          ...errors,
        },
      },
    },
    "/api/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Dashboard summary (dashboard.view)",
        security: bearer,
        responses: successResponses(
          "Current-month order and inventory summary.",
          ok("OK", {
            total_orders: 14,
            pending_orders: 3,
            paid_orders: 11,
            revenue: "12500000.00",
            active_products: 35,
            low_stock_products: 4,
          }),
        ),
      },
    },
    "/api/reports/sales": {
      get: {
        tags: ["Reports"],
        summary: "Sales report (reports.sales)",
        security: bearer,
        parameters: [
          {
            name: "from",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2026-11-01",
          },
          {
            name: "to",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2026-11-05",
          },
          {
            name: "group_by",
            in: "query",
            schema: { type: "string", enum: ["day", "month"], default: "day" },
          },
        ],
        responses: successResponses(
          "Sales grouped by day or month.",
          ok("OK", [
            {
              period: "2026-11-05T00:00:00.000Z",
              total_orders: 8,
              revenue: "3980000.00",
            },
          ]),
        ),
      },
    },
    "/api/reports/top-products": {
      get: {
        tags: ["Reports"],
        summary: "Top products report (reports.top_products)",
        security: bearer,
        parameters: [
          {
            name: "from",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2026-11-01",
          },
          {
            name: "to",
            in: "query",
            required: true,
            schema: { type: "string", format: "date" },
            example: "2026-11-05",
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
          },
        ],
        responses: successResponses(
          "Top products by sold quantity and revenue.",
          ok("OK", [
            {
              product_id: "1",
              product_code: "PRD-001",
              product_name: "Wireless Mouse",
              total_quantity: "24",
              revenue: "4776000.00",
            },
          ]),
        ),
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter the access token returned by the login endpoint.",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "OK" },
          data: {},
          meta: { type: "object", additionalProperties: { type: "integer" } },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        additionalProperties: false,
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "admin@example.com",
          },
          password: {
            type: "string",
            minLength: 1,
            maxLength: 200,
            example: "your-password",
          },
        },
      },
      RefreshRequest: {
        type: "object",
        required: ["refresh_token"],
        additionalProperties: false,
        properties: {
          refresh_token: {
            type: "string",
            minLength: 32,
            maxLength: 500,
            example: "opaque-refresh-token-from-login",
          },
        },
      },
      LogoutRequest: {
        type: "object",
        additionalProperties: false,
        properties: {
          refresh_token: { type: "string", minLength: 32, maxLength: 500 },
        },
      },
      ProductCreateRequest: {
        type: "object",
        required: ["product_code", "product_name", "price"],
        additionalProperties: false,
        properties: {
          product_code: { type: "string", minLength: 1, maxLength: 50 },
          product_name: { type: "string", minLength: 1, maxLength: 200 },
          stock: {
            type: "integer",
            minimum: 0,
            maximum: 2147483647,
            default: 0,
          },
          price: {
            description:
              "Positive decimal with at most two fractional digits, up to 9999999999.99. Send a decimal string to preserve precision.",
            oneOf: [
              {
                type: "string",
                pattern: "^(?=.*[1-9])[0-9]+(\\.[0-9]{1,2})?$",
              },
              {
                type: "number",
                minimum: 0,
                exclusiveMinimum: true,
                maximum: 9999999999.99,
                multipleOf: 0.01,
              },
            ],
            example: "199000.00",
          },
          low_stock_threshold: {
            type: "integer",
            minimum: 0,
            maximum: 2147483647,
            default: 5,
          },
        },
      },
      ProductUpdateRequest: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          product_code: { type: "string", minLength: 1, maxLength: 50 },
          product_name: { type: "string", minLength: 1, maxLength: 200 },
          price: {
            description:
              "Positive decimal with at most two fractional digits, up to 9999999999.99. Send a decimal string to preserve precision.",
            oneOf: [
              {
                type: "string",
                pattern: "^(?=.*[1-9])[0-9]+(\\.[0-9]{1,2})?$",
              },
              {
                type: "number",
                minimum: 0,
                exclusiveMinimum: true,
                maximum: 9999999999.99,
                multipleOf: 0.01,
              },
            ],
          },
          low_stock_threshold: {
            type: "integer",
            minimum: 0,
            maximum: 2147483647,
          },
        },
      },
      StockAdjustmentRequest: {
        type: "object",
        required: ["quantity_change", "note"],
        additionalProperties: false,
        properties: {
          quantity_change: {
            type: "integer",
            minimum: -2147483647,
            maximum: 2147483647,
            not: { enum: [0] },
          },
          note: { type: "string", minLength: 1, maxLength: 1000 },
        },
      },
      CustomerCreateRequest: {
        type: "object",
        required: ["customer_name", "customer_address"],
        additionalProperties: false,
        properties: {
          customer_name: { type: "string", minLength: 1, maxLength: 200 },
          customer_address: { type: "string", minLength: 1, maxLength: 500 },
          gender: { type: "string", enum: ["MALE", "FEMALE"], nullable: true },
          birth_date: { type: "string", format: "date", nullable: true },
          phone: { type: "string", maxLength: 30, nullable: true },
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            nullable: true,
          },
        },
      },
      CustomerUpdateRequest: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          customer_name: { type: "string", minLength: 1, maxLength: 200 },
          customer_address: { type: "string", minLength: 1, maxLength: 500 },
          gender: { type: "string", enum: ["MALE", "FEMALE"], nullable: true },
          birth_date: { type: "string", format: "date", nullable: true },
          phone: { type: "string", maxLength: 30, nullable: true },
          email: {
            type: "string",
            format: "email",
            maxLength: 255,
            nullable: true,
          },
        },
      },
      OrderCreateRequest: {
        type: "object",
        required: ["customer_id", "items"],
        additionalProperties: false,
        properties: {
          customer_id: { type: "string", format: "uuid" },
          items: {
            type: "array",
            minItems: 1,
            maxItems: 100,
            items: {
              type: "object",
              required: ["product_id", "quantity"],
              additionalProperties: false,
              properties: {
                product_id: {
                  description:
                    "Positive signed 64-bit product identifier. Numeric input is limited to JavaScript safe integers; decimal strings support the full signed 64-bit range.",
                  oneOf: [
                    {
                      type: "string",
                      minLength: 1,
                      maxLength: 19,
                      pattern: "^[1-9][0-9]*$",
                    },
                    {
                      type: "integer",
                      minimum: 1,
                      maximum: 9007199254740991,
                    },
                  ],
                },
                quantity: { type: "integer", minimum: 1, maximum: 2147483647 },
              },
            },
          },
        },
      },
      CancelOrderRequest: {
        type: "object",
        required: ["cancel_reason"],
        additionalProperties: false,
        properties: {
          cancel_reason: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description:
              "Whitespace is trimmed and the result must not be empty.",
          },
        },
      },
      EmptyRequest: { type: "object", additionalProperties: false },
    },
  },
};

export default openApiDocument;
