import { z } from "./common.validator";
import { paginationQuerySchema } from "./common.validator";

const orderStatuses = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
] as const;

export const orderIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,18}$/, "Order ID must be a positive integer.")
    .refine(
      (value) =>
        /^[1-9]\d{0,18}$/.test(value) &&
        BigInt(value) <= 9_223_372_036_854_775_807n,
    ),
});

export const orderListQuerySchema = paginationQuerySchema
  .omit({ sort_by: true, sort_order: true })
  .extend({
    sort_by: z
      .enum(["orderNumber", "orderDate", "status", "totalAmount", "itemsCount"])
      .optional(),
    sort_order: z
      .string()
      .transform((value) => value.toUpperCase())
      .pipe(z.enum(["ASC", "DESC"]))
      .optional(),
    status: z
      .string()
      .transform((value) => value.toUpperCase())
      .pipe(z.enum(orderStatuses))
      .optional(),
    customer_id: z.uuid().optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
  })
  .strict()
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "from must be earlier than or equal to to.",
    path: ["from"],
  });

export const orderCreateRequestSchema = z
  .object({
    customer_id: z.uuid(),
    items: z
      .array(
        z
          .object({
            product_id: z
              .union([
                z
                  .string()
                  .regex(/^[1-9]\d{0,18}$/)
                  .refine(
                    (value) =>
                      /^[1-9]\d{0,18}$/.test(value) &&
                      BigInt(value) <= 9_223_372_036_854_775_807n,
                  ),
                z.number().int().positive().safe().max(9_007_199_254_740_991),
              ])
              .transform(String),
            quantity: z.number().int().positive().max(2_147_483_647),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();

export const orderIdempotencyHeaderSchema = z
  .object({ "Idempotency-Key": z.uuid() })
  .strict();

export const orderCancelRequestSchema = z
  .object({ cancel_reason: z.string().trim().min(1).max(500) })
  .strict();

export const emptyRequestSchema = z.object({}).strict();
