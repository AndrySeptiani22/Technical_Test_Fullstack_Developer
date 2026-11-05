import assert from "node:assert/strict";
import test from "node:test";
import {
  customerCreateRequestSchema,
  customerIdParamsSchema,
  customerUpdateRequestSchema,
  productCreateRequestSchema,
  productIdParamsSchema,
  productUpdateRequestSchema,
  stockAdjustmentRequestSchema,
} from "@application/models/validators/catalog.validator";
import {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
} from "@application/models/validators/auth.validator";
import { paginationQuerySchema } from "@application/models/validators/common.validator";
import { parseListFilters } from "@application/models/validators/list-filter.validator";
import { ValidationError } from "@application/models/error/application.error";
import {
  emptyRequestSchema,
  orderCancelRequestSchema,
  orderCreateRequestSchema,
  orderIdempotencyHeaderSchema,
  orderIdParamsSchema,
  orderListQuerySchema,
} from "@application/models/validators/order.validator";
import {
  salesReportQuerySchema,
  topProductsReportQuerySchema,
} from "@application/models/validators/report.validator";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const refreshToken = "x".repeat(32);

function valid(schema: { safeParse: (input: unknown) => { success: boolean } }, input: unknown) {
  assert.equal(schema.safeParse(input).success, true);
}

function invalid(schema: { safeParse: (input: unknown) => { success: boolean } }, input: unknown) {
  assert.equal(schema.safeParse(input).success, false, JSON.stringify(input));
}

test("product path IDs accept positive int64 values and reject malformed IDs", () => {
  valid(productIdParamsSchema, { id: "1" });
  valid(productIdParamsSchema, { id: "9223372036854775807" });
  for (const id of ["", "0", "01", "-1", "1.0", "9223372036854775808", "abc"]) {
    invalid(productIdParamsSchema, { id });
  }
});

test("product creation trims fields, applies defaults, and normalizes prices", () => {
  const parsed = productCreateRequestSchema.parse({
    product_code: "  PRD-001 ",
    product_name: " Mouse ",
    price: 10,
  });
  assert.deepEqual(parsed, {
    product_code: "PRD-001",
    product_name: "Mouse",
    stock: 0,
    price: "10",
    low_stock_threshold: 5,
  });

  for (const price of ["0", "-1", "1.234", "1e2", "10000000000", Number.NaN]) {
    invalid(productCreateRequestSchema, {
      product_code: "P",
      product_name: "Product",
      price,
    });
  }
  for (const input of [
    { product_code: " ", product_name: "P", price: "1" },
    { product_code: "P", product_name: " ", price: "1" },
    { product_code: "P".repeat(51), product_name: "P", price: "1" },
    { product_code: "P", product_name: "P".repeat(201), price: "1" },
    { product_code: "P", product_name: "P", price: "1", stock: -1 },
    { product_code: "P", product_name: "P", price: "1", stock: 1.5 },
    { product_code: "P", product_name: "P", price: "1", unknown: true },
  ]) {
    invalid(productCreateRequestSchema, input);
  }
});

test("product updates require at least one supported field and reject stock", () => {
  for (const update of [
    { product_code: "P" },
    { product_name: "P" },
    { price: "12.99" },
    { low_stock_threshold: 0 },
  ]) {
    valid(productUpdateRequestSchema, update);
  }
  for (const update of [{}, { stock: 5 }, { product_name: "" }, { price: "0" }]) {
    invalid(productUpdateRequestSchema, update);
  }
});

test("stock adjustment accepts nonzero signed int32 deltas and trimmed notes", () => {
  const parsed = stockAdjustmentRequestSchema.parse({
    quantity_change: -2_147_483_647,
    note: "  Damaged items  ",
  });
  assert.equal(parsed.note, "Damaged items");

  for (const delta of [0, 1.5, 2_147_483_648, -2_147_483_648]) {
    invalid(stockAdjustmentRequestSchema, {
      quantity_change: delta,
      note: "Adjustment",
    });
  }
  for (const note of [" ", "n".repeat(1001)]) {
    invalid(stockAdjustmentRequestSchema, { quantity_change: 1, note });
  }
  invalid(stockAdjustmentRequestSchema, {
    quantity_change: 1,
    note: "ok",
    extra: true,
  });
});

test("customer IDs and create/update payloads enforce UUID and field constraints", () => {
  valid(customerIdParamsSchema, { id: uuid });
  invalid(customerIdParamsSchema, { id: "1" });

  const customer = {
    customer_name: "  Ayu Putri ",
    customer_address: " Jakarta ",
    gender: "FEMALE",
    birth_date: "1995-06-15",
    phone: "+628123456789",
    email: "ayu@example.com",
  };
  const parsed = customerCreateRequestSchema.parse(customer);
  assert.equal(parsed.customer_name, "Ayu Putri");
  assert.equal(parsed.customer_address, "Jakarta");
  valid(customerCreateRequestSchema, {
    customer_name: "A",
    customer_address: "B",
    gender: null,
    birth_date: null,
    phone: null,
    email: null,
  });

  for (const input of [
    { customer_name: "", customer_address: "B" },
    { customer_name: "A", customer_address: "" },
    { customer_name: "A", customer_address: "B", gender: "OTHER" },
    { customer_name: "A", customer_address: "B", birth_date: "2024-02-30" },
    { customer_name: "A", customer_address: "B", phone: "x".repeat(31) },
    { customer_name: "A", customer_address: "B", email: "not-an-email" },
    { customer_name: "A", customer_address: "B", extra: true },
  ]) {
    invalid(customerCreateRequestSchema, input);
  }

  for (const update of [
    { customer_name: "New name" },
    { gender: null },
    { phone: null },
    { email: "new@example.com" },
  ]) {
    valid(customerUpdateRequestSchema, update);
  }
  for (const update of [{}, { customer_name: "" }, { extra: "field" }]) {
    invalid(customerUpdateRequestSchema, update);
  }
});

test("authentication request schemas enforce credentials and token bounds", () => {
  valid(loginRequestSchema, { email: "a@example.com", password: "p" });
  for (const input of [
    { email: "invalid", password: "p" },
    { email: "a@example.com", password: "" },
    { email: "a@example.com", password: "p".repeat(201) },
    { email: "a@example.com", password: "p", extra: true },
  ]) {
    invalid(loginRequestSchema, input);
  }

  valid(refreshRequestSchema, { refresh_token: refreshToken });
  invalid(refreshRequestSchema, { refresh_token: "short" });
  invalid(refreshRequestSchema, { refresh_token: "x".repeat(501) });
  valid(logoutRequestSchema, {});
  valid(logoutRequestSchema, { refresh_token: refreshToken });
  invalid(logoutRequestSchema, { refresh_token: "short" });
  invalid(logoutRequestSchema, { extra: true });
});

test("pagination defaults, aliases, limits, and strict query keys are enforced", () => {
  assert.deepEqual(paginationQuerySchema.parse({}), {
    page: 1,
    sort_order: "ASC",
  });
  assert.deepEqual(paginationQuerySchema.parse({
    page: "2",
    pageSize: "30",
    sort_order: "desc",
  }), {
    page: 2,
    pageSize: 30,
    sort_order: "DESC",
  });
  for (const query of [
    { page: "0" },
    { limit: "-1" },
    { pageSize: "1.2" },
    { sort_order: "sideways" },
    { search: "s".repeat(201) },
    { sort_by: "s".repeat(51) },
    { unknown: "value" },
  ]) {
    invalid(paginationQuerySchema, query);
  }
});

test("grid filters validate fields, operators, value types, and unary operators", () => {
  const allowedFields = {
    name: "text",
    status: "text",
    stock: "number",
    created: "date",
  } as const;
  assert.deepEqual(
    parseListFilters(
      JSON.stringify([
        { field: "name", operator: "contains", value: "mouse" },
        { field: "stock", operator: "greater_or_equal", value: "5" },
        { field: "created", operator: "less_than", value: "2026-01-01" },
        { field: "name", operator: "is_empty" },
        {
          field: "status",
          operator: "in",
          values: ["PENDING", "PAID"],
        },
      ]),
      allowedFields,
      { status: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"] },
    ),
    [
      { field: "name", operator: "contains", value: "mouse" },
      { field: "stock", operator: "greater_or_equal", value: "5" },
      { field: "created", operator: "less_than", value: "2026-01-01" },
      { field: "name", operator: "is_empty" },
      { field: "status", operator: "in", values: ["PENDING", "PAID"] },
    ],
  );
  for (const filters of [
    "not-json",
    JSON.stringify([{ field: "unknown", operator: "equals", value: "x" }]),
    JSON.stringify([{ field: "stock", operator: "contains", value: "5" }]),
    JSON.stringify([{ field: "stock", operator: "equals", value: "NaN" }]),
    JSON.stringify([{ field: "created", operator: "equals", value: "tomorrow" }]),
    JSON.stringify([{ field: "name", operator: "equals" }]),
    JSON.stringify([{ field: "name", operator: "is_empty", value: "x" }]),
    JSON.stringify([{ field: "status", operator: "in", values: ["UNKNOWN"] }]),
    JSON.stringify([{ field: "status", operator: "in", values: ["PAID", "PAID"] }]),
    JSON.stringify([{ field: "stock", operator: "in", values: ["5"] }]),
  ]) {
    assert.throws(
      () =>
        parseListFilters(filters, allowedFields, {
          status: ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"],
        }),
      ValidationError,
    );
  }
});

test("order IDs and list filters validate status, UUID, dates, and ordering", () => {
  valid(orderIdParamsSchema, { id: "9223372036854775807" });
  for (const id of ["0", "01", "-1", "1.0", "9223372036854775808"]) {
    invalid(orderIdParamsSchema, { id });
  }

  assert.deepEqual(orderListQuerySchema.parse({
    status: "pending",
    search: "AZ-",
    sort_by: "totalAmount",
    sort_order: "asc",
    customer_id: uuid,
    from: "2026-01-01",
    to: "2026-01-31",
  }), {
    page: 1,
    sort_by: "totalAmount",
    sort_order: "ASC",
    status: "PENDING",
    search: "AZ-",
    customer_id: uuid,
    from: "2026-01-01",
    to: "2026-01-31",
  });
  for (const query of [
    { status: "unknown" },
    { customer_id: "not-a-uuid" },
    { from: "2026-02-01", to: "2026-01-31" },
    { search: "s".repeat(201) },
    { sort_by: "not-supported" },
    { sort_order: "sideways" },
  ]) {
    invalid(orderListQuerySchema, query);
  }
});

test("order creation accepts string or numeric product IDs and bounded item lists", () => {
  const order = { customer_id: uuid, items: [{ product_id: "1", quantity: 1 }] };
  assert.deepEqual(orderCreateRequestSchema.parse(order).items[0], {
    product_id: "1",
    quantity: 1,
  });
  assert.equal(
    orderCreateRequestSchema.parse({
      customer_id: uuid,
      items: [{ product_id: 1, quantity: 2 }],
    }).items[0].product_id,
    "1",
  );
  valid(orderCreateRequestSchema, {
    customer_id: uuid,
    items: Array.from({ length: 100 }, (_, index) => ({
      product_id: index + 1,
      quantity: 2_147_483_647,
    })),
  });

  for (const items of [
    [],
    Array.from({ length: 101 }, () => ({ product_id: 1, quantity: 1 })),
    [{ product_id: 0, quantity: 1 }],
    [{ product_id: "01", quantity: 1 }],
    [{ product_id: "1.0", quantity: 1 }],
    [{ product_id: "9223372036854775808", quantity: 1 }],
    [{ product_id: 1.2, quantity: 1 }],
    [{ product_id: 1, quantity: 0 }],
    [{ product_id: 1, quantity: 2_147_483_648 }],
    [{ product_id: 1, quantity: 1, extra: true }],
  ]) {
    invalid(orderCreateRequestSchema, { customer_id: uuid, items });
  }
  invalid(orderCreateRequestSchema, { customer_id: "bad", items: order.items });
  invalid(orderCreateRequestSchema, { ...order, extra: true });
});

test("order idempotency, cancellation, and empty request schemas are strict", () => {
  valid(orderIdempotencyHeaderSchema, {
    "Idempotency-Key": "50cce154-6d63-4dc4-a7f9-41b8e4edaf57",
  });
  invalid(orderIdempotencyHeaderSchema, { "Idempotency-Key": "not-a-uuid" });
  invalid(orderIdempotencyHeaderSchema, {
    "Idempotency-Key": uuid,
    other: "value",
  });

  assert.equal(orderCancelRequestSchema.parse({ cancel_reason: "  Requested  " }).cancel_reason, "Requested");
  invalid(orderCancelRequestSchema, { cancel_reason: " " });
  invalid(orderCancelRequestSchema, { cancel_reason: "x".repeat(501) });
  valid(emptyRequestSchema, {});
  invalid(emptyRequestSchema, { extra: true });
});

test("report query schemas enforce date ranges and use documented defaults", () => {
  assert.deepEqual(salesReportQuerySchema.parse({
    from: "2026-01-01",
    to: "2026-01-31",
  }), {
    from: "2026-01-01",
    to: "2026-01-31",
    group_by: "day",
  });
  assert.deepEqual(topProductsReportQuerySchema.parse({
    from: "2026-01-01",
    to: "2026-01-31",
  }), {
    from: "2026-01-01",
    to: "2026-01-31",
    limit: 10,
  });
  assert.equal(topProductsReportQuerySchema.parse({
    from: "2026-01-01",
    to: "2026-01-31",
    limit: "25",
  }).limit, 25);

  for (const query of [
    { from: "2026-02-01", to: "2026-01-31" },
    { from: "not-a-date", to: "2026-01-31" },
    { from: "2026-01-01", to: "2026-01-31", extra: true },
  ]) {
    invalid(salesReportQuerySchema, query);
  }
  invalid(salesReportQuerySchema, {
    from: "2026-01-01",
    to: "2026-01-31",
    group_by: "year",
  });
  for (const limit of ["0", "-1", "1.5"]) {
    invalid(topProductsReportQuerySchema, {
      from: "2026-01-01",
      to: "2026-01-31",
      limit,
    });
  }
});
