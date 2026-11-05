import { http } from "../http/client";
import type { IDashboardRepository } from "@/domain/repositories";
import type {
  ApiEnvelope,
  DashboardSummary,
  SalesPeriod,
  TopProduct,
} from "@/domain/entities";
import { queryString } from "./query-string";

export class DashboardRepository implements IDashboardRepository {
  async summary() {
    const { data } =
      await http.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
    return data;
  }

  async sales(from: string, to: string, groupBy: "day" | "month") {
    const { data } = await http.get<ApiEnvelope<SalesPeriod[]>>(
      `/reports/sales${queryString({ from, to, group_by: groupBy })}`,
    );
    return data;
  }

  async topProducts(from: string, to: string, limit: number) {
    const { data } = await http.get<ApiEnvelope<TopProduct[]>>(
      `/reports/top-products${queryString({ from, to, limit })}`,
    );
    return data;
  }
}
