import assert from "node:assert/strict";
import test from "node:test";
import { auditRequestMetadata } from "@presentation/middleware/audit-metadata";

test("audit request metadata keeps useful fields and redacts sensitive values", () => {
  assert.deepEqual(
    auditRequestMetadata({
      page: 2,
      filters: [
        { field: "status", operator: "in", values: ["PAID", "SHIPPED"] },
        { field: "email", operator: "equals", value: "private@example.com" },
      ],
      search: "customer search",
      password: "private password",
    }),
    {
      requestBody: {
        page: 2,
        filters: [
          { field: "status", operator: "in", values: ["PAID", "SHIPPED"] },
          {
            field: "email",
            operator: "equals",
            value: "",
          },
        ],
        search: "",
        password: "",
      },
    },
  );
});

test("audit request metadata omits empty bodies and bounds large metadata", () => {
  assert.deepEqual(auditRequestMetadata({}), {});
  assert.deepEqual(auditRequestMetadata(undefined), {});
  assert.deepEqual(
    auditRequestMetadata({
      values: Array.from({ length: 100 }, () => "x".repeat(500)),
    }),
    {
      requestBody: {
        truncated: true,
        reason:
          "Sanitized request body exceeded the audit metadata size limit.",
      },
    },
  );
});
