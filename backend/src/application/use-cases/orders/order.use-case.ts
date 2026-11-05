import { randomUUID } from "crypto";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderTransitionInput,
} from "@application/abstract/repositories/iorder.repository";

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
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
  }) {
    return this.orderRepository.list(query);
  }

  static newIdempotencyKey(): string {
    return randomUUID();
  }
}
