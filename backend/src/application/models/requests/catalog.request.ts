import type { z } from "zod";
import type {
  customerCreateRequestSchema,
  customerIdParamsSchema,
  customerUpdateRequestSchema,
  productCreateRequestSchema,
  productIdParamsSchema,
  productUpdateRequestSchema,
  stockAdjustmentRequestSchema,
} from "@application/models/validators/catalog.validator";
import type { paginationQuerySchema } from "@application/models/validators/common.validator";

export type ProductIdParams = z.infer<typeof productIdParamsSchema>;
export type ProductListRequest = z.infer<typeof paginationQuerySchema>;
export type ProductCreateRequest = z.infer<typeof productCreateRequestSchema>;
export type ProductUpdateRequest = z.infer<typeof productUpdateRequestSchema>;
export type StockAdjustmentRequest = z.infer<
  typeof stockAdjustmentRequestSchema
>;
export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
export type CustomerCreateRequest = z.infer<typeof customerCreateRequestSchema>;
export type CustomerUpdateRequest = z.infer<typeof customerUpdateRequestSchema>;
export type CustomerListRequest = z.infer<typeof paginationQuerySchema>;
