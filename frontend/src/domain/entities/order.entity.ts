import type { DecimalString, ISODateString, UUID } from "./common.entity";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

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
