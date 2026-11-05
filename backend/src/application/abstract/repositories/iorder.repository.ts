import type {
  OrderAction,
  ShopRole,
} from "@domain/services/order-state-machine";
import type { Order } from "@domain/entities/order.entity";
import type { ListFilter } from "./icatalog.repository";

export interface CreateOrderInput {
  userId: string;
  idempotencyKey: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface OrderTransitionInput {
  orderId: string;
  userId: string;
  role: ShopRole;
  action: OrderAction;
  reason?: string;
}

export interface IOrderRepository {
  createWithStockReservation(input: CreateOrderInput): Promise<{
    order: Order;
    replayed: boolean;
    responseBody: unknown;
    responseStatus: number;
  }>;
  transition(input: OrderTransitionInput): Promise<Order>;
  findById(orderId: string): Promise<Order | null>;
  list(query: {
    page: number;
    limit: number;
    all?: boolean;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
    search?: string;
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
    filters?: ListFilter[];
  }): Promise<{ items: Order[]; meta: Record<string, number> }>;
}
