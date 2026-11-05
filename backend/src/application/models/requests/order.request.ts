import type { z } from "zod";
import type {
  emptyRequestSchema,
  orderCancelRequestSchema,
  orderCreateRequestSchema,
  orderIdempotencyHeaderSchema,
  orderIdParamsSchema,
  orderListQuerySchema,
} from "@application/models/validators/order.validator";

export type OrderIdParams = z.infer<typeof orderIdParamsSchema>;
export type OrderListRequest = z.infer<typeof orderListQuerySchema>;
export type OrderCreateRequest = z.infer<typeof orderCreateRequestSchema>;
export type OrderIdempotencyHeader = z.infer<
  typeof orderIdempotencyHeaderSchema
>;
export type OrderCancelRequest = z.infer<typeof orderCancelRequestSchema>;
export type EmptyRequest = z.infer<typeof emptyRequestSchema>;
