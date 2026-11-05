import type {
  ApiEnvelope,
  AuthSession,
  Customer,
  DashboardSummary,
  Order,
  OrderStatus,
  Product,
  SalesPeriod,
  StockMovement,
  TopProduct,
  User,
} from "./entities";

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface OrderListQuery extends ListQuery {
  status?: OrderStatus;
  customer_id?: string;
  from?: string;
  to?: string;
}

export interface IAuthRepository {
  login(email: string, password: string): Promise<ApiEnvelope<AuthSession>>;
  logout(refreshToken?: string): Promise<ApiEnvelope<null>>;
  refresh(refreshToken: string): Promise<ApiEnvelope<AuthSession>>;
  me(): Promise<ApiEnvelope<User>>;
}

export interface IProductRepository {
  list(q: ListQuery): Promise<ApiEnvelope<Product[]>>;
  get(id: string): Promise<ApiEnvelope<Product>>;
  create(payload: Partial<Product>): Promise<ApiEnvelope<Product>>;
  update(id: string, payload: Partial<Product>): Promise<ApiEnvelope<Product>>;
  remove(id: string): Promise<void>;
  adjustStock(
    id: string,
    change: number,
    note: string,
  ): Promise<ApiEnvelope<Product>>;
  listMovements(
    id: string,
    q: ListQuery,
  ): Promise<ApiEnvelope<StockMovement[]>>;
}

export interface ICustomerRepository {
  list(q: ListQuery): Promise<ApiEnvelope<Customer[]>>;
  get(id: string): Promise<ApiEnvelope<Customer>>;
  create(payload: Partial<Customer>): Promise<ApiEnvelope<Customer>>;
  update(
    id: string,
    payload: Partial<Customer>,
  ): Promise<ApiEnvelope<Customer>>;
  remove(id: string): Promise<void>;
}

export interface OrderCreatePayload {
  customer_id: string;
  items: { product_id: string; quantity: number }[];
}

export interface IOrderRepository {
  list(q: OrderListQuery): Promise<ApiEnvelope<Order[]>>;
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

export interface IDashboardRepository {
  summary(): Promise<ApiEnvelope<DashboardSummary>>;
  sales(
    from: string,
    to: string,
    groupBy: "day" | "month",
  ): Promise<ApiEnvelope<SalesPeriod[]>>;
  topProducts(
    from: string,
    to: string,
    limit: number,
  ): Promise<ApiEnvelope<TopProduct[]>>;
}
