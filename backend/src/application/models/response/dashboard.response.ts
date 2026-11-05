import { apiSuccess, type ApiSuccessResponse } from "./api.response";

export interface DashboardSummary {
  total_orders: number;
  pending_orders: number;
  paid_orders: number;
  revenue: string;
  active_products: number;
  low_stock_products: number;
}

export const dashboardSummaryResponse = (
  data: DashboardSummary,
): ApiSuccessResponse<DashboardSummary> => apiSuccess("OK", data);
