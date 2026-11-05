import { randomUUID } from "crypto";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderTransitionInput,
} from "@application/abstract/repositories/iorder.repository";
import type { ListFilter } from "@application/abstract/repositories/icatalog.repository";

export class OrderUseCase {
  constructor(private readonly orderRepository: IOrderRepository) {}

  create(input: CreateOrderInput) {
    return this.orderRepository.createWithStockReservation(input);
  }

  transition(input: OrderTransitionInput) {
    return this.orderRepository.transition(input);
  }

  getById(orderId: string) {
    return this.orderRepository.findById(orderId);
  }

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
  }) {
    return this.orderRepository.list(query);
  }

  static newIdempotencyKey(): string {
    return randomUUID();
  }
}
