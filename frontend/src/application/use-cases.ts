import { v4 as uuidv4 } from "uuid";
import { repositories } from "@/infrastructure/repositories";
import type {
  OrderCreatePayload,
  ListQuery,
  OrderListQuery,
} from "@/domain/repositories";

export const useCases = {
  // Auth
  loginUser: (email: string, password: string) =>
    repositories.auth.login(email, password),
  logoutUser: (refreshToken?: string) => repositories.auth.logout(refreshToken),
  refreshSession: (refreshToken: string) =>
    repositories.auth.refresh(refreshToken),
  fetchCurrentUser: () => repositories.auth.me(),

  // Products
  listProducts: (q: ListQuery) => repositories.products.list(q),
  getProduct: (id: string) => repositories.products.get(id),
  createProduct: (payload: any) => repositories.products.create(payload),
  updateProduct: (id: string, payload: any) =>
    repositories.products.update(id, payload),
  deleteProduct: (id: string) => repositories.products.remove(id),
  adjustStock: (id: string, change: number, note: string) =>
    repositories.products.adjustStock(id, change, note),
  listStockMovements: (id: string, q: ListQuery) =>
    repositories.products.listMovements(id, q),

  // Customers
  listCustomers: (q: ListQuery) => repositories.customers.list(q),
  getCustomer: (id: string) => repositories.customers.get(id),
  createCustomer: (payload: any) => repositories.customers.create(payload),
  updateCustomer: (id: string, payload: any) =>
    repositories.customers.update(id, payload),
  deleteCustomer: (id: string) => repositories.customers.remove(id),

  // Orders — uses idempotency key to prevent duplicate submissions.
  listOrders: (q: OrderListQuery) => repositories.orders.list(q),
  getOrder: (id: string) => repositories.orders.get(id),
  createOrder: (payload: OrderCreatePayload) =>
    repositories.orders.create(payload, uuidv4()),
  payOrder: (id: string) => repositories.orders.pay(id),
  shipOrder: (id: string) => repositories.orders.ship(id),
  completeOrder: (id: string) => repositories.orders.complete(id),
  cancelOrder: (id: string, reason: string) =>
    repositories.orders.cancel(id, reason),
  getInvoice: (id: string) => repositories.orders.invoiceHtml(id),

  // Reports
  dashboardSummary: () => repositories.dashboard.summary(),
  salesReport: (from: string, to: string, groupBy: "day" | "month") =>
    repositories.dashboard.sales(from, to, groupBy),
  topProductsReport: (from: string, to: string, limit: number) =>
    repositories.dashboard.topProducts(from, to, limit),
};
