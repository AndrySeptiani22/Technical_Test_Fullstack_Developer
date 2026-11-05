export type UUID = string;
export type ISODateString = string;
export type DecimalString = string;

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";
export type Gender = "MALE" | "FEMALE";

export interface User {
  userId: UUID;
  name: string;
  email: string;
  roleCode: string;
  permissions: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  stock: number;
  price: DecimalString;
  low_stock_threshold: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Customer {
  id: UUID;
  customer_name: string;
  customer_address: string;
  gender: Gender | null;
  birth_date: string | null;
  phone: string | null;
  email: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: DecimalString;
  subtotal: DecimalString;
}

export interface OrderHistoryEntry {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  reason: string | null;
  created_by: UUID;
  created_at: ISODateString;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: UUID;
  created_by: UUID;
  status: OrderStatus;
  total_amount: DecimalString;
  order_date: ISODateString;
  paid_at: ISODateString | null;
  shipped_at: ISODateString | null;
  completed_at: ISODateString | null;
  cancelled_at: ISODateString | null;
  cancel_reason: string | null;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: "ORDER" | "ADJUSTMENT" | "CANCEL_RESTORE";
  quantity_change: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: UUID;
  created_at: ISODateString;
}

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

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string };
  errors?: Record<string, string[]>;
}

export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}
