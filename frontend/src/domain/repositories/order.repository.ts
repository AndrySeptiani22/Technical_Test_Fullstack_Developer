import type { ApiEnvelope, Order, OrderStatus } from "../entities";
import type { ListQuery } from "./common.repository";

export interface OrderListQuery extends ListQuery {
  status?: OrderStatus;
  customer_id?: string;
  from?: string;
  to?: string;
}

export interface OrderCreatePayload {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
}

export interface IOrderRepository {
  list(query: OrderListQuery): Promise<ApiEnvelope<Order[]>>;
  filter(query: OrderListQuery): Promise<ApiEnvelope<Order[]>>;
  get(id: string): Promise<ApiEnvelope<Order>>;
  create(
    payload: OrderCreatePayload,
    idempotencyKey: string,
  ): Promise<ApiEnvelope<Order>>;
  pay(id: string): Promise<ApiEnvelope<Order>>;
  ship(id: string): Promise<ApiEnvelope<Order>>;
  complete(id: string): Promise<ApiEnvelope<Order>>;
  cancel(id: string, reason: string): Promise<ApiEnvelope<Order>>;
  invoiceHtml(id: string): Promise<string>;
}
