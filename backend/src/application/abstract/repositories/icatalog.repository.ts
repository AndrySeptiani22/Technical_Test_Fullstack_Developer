import type { Customer, Product, StockMovement } from "@domain/entities";

export interface ListQuery {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface IProductRepository {
  list(
    query: ListQuery,
  ): Promise<{ items: Product[]; meta: Record<string, number> }>;
  getById(id: string): Promise<Product | null>;
  create(
    input: Pick<
      Product,
      "productCode" | "productName" | "stock" | "price" | "lowStockThreshold"
    >,
  ): Promise<Product>;
  update(
    id: string,
    input: Partial<
      Pick<
        Product,
        "productCode" | "productName" | "price" | "lowStockThreshold"
      >
    >,
  ): Promise<Product>;
  softDelete(id: string): Promise<void>;
  adjustStock(
    id: string,
    delta: number,
    note: string,
    userId: string,
  ): Promise<Product>;
  movements(
    id: string,
    query: Pick<ListQuery, "page" | "limit">,
  ): Promise<{ items: StockMovement[]; meta: Record<string, number> }>;
}

export interface ICustomerRepository {
  list(
    query: ListQuery,
  ): Promise<{ items: Customer[]; meta: Record<string, number> }>;
  getById(id: string): Promise<Customer | null>;
  create(
    input: Pick<
      Customer,
      | "customerName"
      | "customerAddress"
      | "gender"
      | "birthDate"
      | "phone"
      | "email"
    >,
  ): Promise<Customer>;
  update(
    id: string,
    input: Partial<
      Pick<
        Customer,
        | "customerName"
        | "customerAddress"
        | "gender"
        | "birthDate"
        | "phone"
        | "email"
      >
    >,
  ): Promise<Customer>;
  softDelete(id: string): Promise<void>;
}
