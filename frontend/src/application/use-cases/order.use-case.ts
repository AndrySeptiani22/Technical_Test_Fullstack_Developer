import { v4 as uuidv4 } from "uuid";
import { repositories } from "@/infrastructure/repositories";
import type { OrderCreatePayload, OrderListQuery } from "@/domain/repositories";

export const listOrders = (query: OrderListQuery) =>
  repositories.orders.list(query);
export const filterOrders = (query: OrderListQuery) =>
  repositories.orders.filter(query);
export const getOrder = (id: string) => repositories.orders.get(id);
export const createOrder = (payload: OrderCreatePayload) =>
  repositories.orders.create(payload, uuidv4());
export const payOrder = (id: string) => repositories.orders.pay(id);
export const shipOrder = (id: string) => repositories.orders.ship(id);
export const completeOrder = (id: string) =>
  repositories.orders.complete(id);
export const cancelOrder = (id: string, reason: string) =>
  repositories.orders.cancel(id, reason);
export const getInvoice = (id: string) => repositories.orders.invoiceHtml(id);
