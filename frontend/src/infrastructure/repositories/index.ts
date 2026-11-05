import { http } from "../http/client";
import type {
  IAuthRepository,
  IProductRepository,
  ICustomerRepository,
  IOrderRepository,
  IDashboardRepository,
  ListQuery,
  OrderListQuery,
  OrderCreatePayload,
} from "@/domain/repositories";
import type {
  AuthSession,
  Customer,
  Order,
  Product,
  StockMovement,
  User,
  DashboardSummary,
  SalesPeriod,
  TopProduct,
  ApiEnvelope,
} from "@/domain/entities";

function qs(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export class AuthRepository implements IAuthRepository {
  async login(email: string, password: string) {
    const { data } = await http.post<ApiEnvelope<AuthSession>>("/auth/login", {
      email,
      password,
    });
    return data;
  }
  async logout(refresh_token?: string) {
    const { data } = await http.post<ApiEnvelope<null>>(
      "/auth/logout",
      refresh_token ? { refresh_token } : {},
    );
    return data;
  }
  async refresh(refresh_token: string) {
    const { data } = await http.post<ApiEnvelope<AuthSession>>(
      "/auth/refresh",
      { refresh_token },
    );
    return data;
  }
  async me() {
    const { data } = await http.get<ApiEnvelope<User>>("/auth/me");
    return data;
  }
}

export class ProductRepository implements IProductRepository {
  async list(q: ListQuery) {
    const { data } = await http.get<ApiEnvelope<Product[]>>(
      `/products${qs(q as any)}`,
    );
    return data;
  }
  async get(id: string) {
    const { data } = await http.get<ApiEnvelope<Product>>(`/products/${id}`);
    return data;
  }
  async create(payload: Partial<Product>) {
    const { data } = await http.post<ApiEnvelope<Product>>(
      "/products",
      payload,
    );
    return data;
  }
  async update(id: string, payload: Partial<Product>) {
    const { data } = await http.put<ApiEnvelope<Product>>(
      `/products/${id}`,
      payload,
    );
    return data;
  }
  async remove(id: string) {
    await http.delete(`/products/${id}`);
  }
  async adjustStock(id: string, change: number, note: string) {
    const { data } = await http.post<ApiEnvelope<Product>>(
      `/products/${id}/stock-adjustments`,
      { quantity_change: change, note },
    );
    return data;
  }
  async listMovements(id: string, q: ListQuery) {
    const { data } = await http.get<ApiEnvelope<StockMovement[]>>(
      `/products/${id}/stock-movements${qs(q as any)}`,
    );
    return data;
  }
}

export class CustomerRepository implements ICustomerRepository {
  async list(q: ListQuery) {
    const { data } = await http.get<ApiEnvelope<Customer[]>>(
      `/customers${qs(q as any)}`,
    );
    return data;
  }
  async get(id: string) {
    const { data } = await http.get<ApiEnvelope<Customer>>(`/customers/${id}`);
    return data;
  }
  async create(payload: Partial<Customer>) {
    const { data } = await http.post<ApiEnvelope<Customer>>(
      "/customers",
      payload,
    );
    return data;
  }
  async update(id: string, payload: Partial<Customer>) {
    const { data } = await http.put<ApiEnvelope<Customer>>(
      `/customers/${id}`,
      payload,
    );
    return data;
  }
  async remove(id: string) {
    await http.delete(`/customers/${id}`);
  }
}

export class OrderRepository implements IOrderRepository {
  async list(q: OrderListQuery) {
    const { data } = await http.get<ApiEnvelope<Order[]>>(
      `/orders${qs(q as any)}`,
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

export class DashboardRepository implements IDashboardRepository {
  async summary() {
    const { data } =
      await http.get<ApiEnvelope<DashboardSummary>>("/dashboard/summary");
    return data;
  }
  async sales(from: string, to: string, group_by: "day" | "month") {
    const { data } = await http.get<ApiEnvelope<SalesPeriod[]>>(
      `/reports/sales${qs({ from, to, group_by })}`,
    );
    return data;
  }
  async topProducts(from: string, to: string, limit: number) {
    const { data } = await http.get<ApiEnvelope<TopProduct[]>>(
      `/reports/top-products${qs({ from, to, limit })}`,
    );
    return data;
  }
}

export const repositories = {
  auth: new AuthRepository(),
  products: new ProductRepository(),
  customers: new CustomerRepository(),
  orders: new OrderRepository(),
  dashboard: new DashboardRepository(),
};
