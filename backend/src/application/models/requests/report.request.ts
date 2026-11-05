import type { z } from "zod";
import type {
  salesReportQuerySchema,
  topProductsReportQuerySchema,
} from "@application/models/validators/report.validator";

export type SalesReportRequest = z.infer<typeof salesReportQuerySchema>;
export type TopProductsReportRequest = z.infer<
  typeof topProductsReportQuerySchema
>;
