import { http } from "../http/client";
import type {
  IOrderRepository,
  OrderCreatePayload,
  OrderListQuery,
} from "@/domain/repositories";
import type { ApiEnvelope, Order } from "@/domain/entities";
import { listQueryParams, queryString } from "./query-string";

export class OrderRepository implements IOrderRepository {
  async list(query: OrderListQuery) {
    const params = listQueryParams(query);
    const { data } = await http.get<ApiEnvelope<Order[]>>(
      `/orders${queryString(params)}`,
    );
    return data;
  }

  async filter(query: OrderListQuery) {
    const { data } = await http.post<ApiEnvelope<Order[]>>(
      "/orders/filter",
      query,
    );
    return data;
  }

  async get(id: string) {
    const { data } = await http.get<ApiEnvelope<Order>>(`/orders/${id}`);
    return data;
  }

  async create(payload: OrderCreatePayload, idempotencyKey: string) {
    const { data } = await http.post<ApiEnvelope<Order>>("/orders", payload, {
      headers: { "Idempotency-Key": idempotencyKey },
    });
    return data;
  }

  async pay(id: string) {
    const { data } = await http.post<ApiEnvelope<Order>>(
      `/orders/${id}/pay`,
      {},
    );
    return data;
  }

  async ship(id: string) {
    const { data } = await http.post<ApiEnvelope<Order>>(
      `/orders/${id}/ship`,
      {},
    );
    return data;
  }

  async complete(id: string) {
    const { data } = await http.post<ApiEnvelope<Order>>(
      `/orders/${id}/complete`,
      {},
    );
    return data;
  }

  async cancel(id: string, reason: string) {
    const { data } = await http.post<ApiEnvelope<Order>>(
      `/orders/${id}/cancel`,
      { cancel_reason: reason },
    );
    return data;
  }

  async invoiceHtml(id: string) {
    const { data } = await http.get<string>(`/orders/${id}/invoice`, {
      responseType: "text",
    });
    return data;
  }
}
