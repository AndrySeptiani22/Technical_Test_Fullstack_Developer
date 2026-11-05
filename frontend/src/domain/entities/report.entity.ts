import type { DecimalString, ISODateString } from "./common.entity";

export interface DashboardSummary {
  total_orders: number;
  pending_orders: number;
  paid_orders: number;
  revenue: DecimalString;
  active_products: number;
  low_stock_products: number;
}

export interface SalesPeriod {
  period: ISODateString;
  total_orders: number;
  revenue: DecimalString;
}

export interface TopProduct {
  product_id: string;
  product_code: string;
  product_name: string;
  total_quantity: string;
  revenue: DecimalString;
}
