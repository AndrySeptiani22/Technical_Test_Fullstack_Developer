import type { ApiEnvelope, Product, StockMovement } from "../entities";
import type { ListQuery } from "./common.repository";

export interface IProductRepository {
  list(query: ListQuery): Promise<ApiEnvelope<Product[]>>;
  filter(query: ListQuery): Promise<ApiEnvelope<Product[]>>;
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
    query: ListQuery,
  ): Promise<ApiEnvelope<StockMovement[]>>;
}
