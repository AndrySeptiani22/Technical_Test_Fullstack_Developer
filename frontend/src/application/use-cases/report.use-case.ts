import { repositories } from "@/infrastructure/repositories";

export const dashboardSummary = () => repositories.dashboard.summary();
export const salesReport = (
  from: string,
  to: string,
  groupBy: "day" | "month",
) => repositories.dashboard.sales(from, to, groupBy);
export const topProductsReport = (from: string, to: string, limit: number) =>
  repositories.dashboard.topProducts(from, to, limit);
