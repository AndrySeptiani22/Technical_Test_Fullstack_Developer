import type {
  ApiEnvelope,
  DashboardSummary,
  SalesPeriod,
  TopProduct,
} from "../entities";

export interface IDashboardRepository {
  summary(): Promise<ApiEnvelope<DashboardSummary>>;
  sales(
    from: string,
    to: string,
    groupBy: "day" | "month",
  ): Promise<ApiEnvelope<SalesPeriod[]>>;
  topProducts(
    from: string,
    to: string,
    limit: number,
  ): Promise<ApiEnvelope<TopProduct[]>>;
}
