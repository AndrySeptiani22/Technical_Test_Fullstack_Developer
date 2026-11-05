import { apiSuccess, type ApiSuccessResponse } from "./api.response";

export interface SalesReportRow {
  period: Date;
  total_orders: number;
  revenue: string;
}

export interface TopProductReportRow {
  product_id: string;
  product_code: string;
  product_name: string;
  total_quantity: string;
  revenue: string;
}

export const salesReportResponse = (
  rows: SalesReportRow[],
): ApiSuccessResponse<SalesReportRow[]> => apiSuccess("OK", rows);

export const topProductsReportResponse = (
  rows: TopProductReportRow[],
): ApiSuccessResponse<TopProductReportRow[]> => apiSuccess("OK", rows);
