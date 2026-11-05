import { http } from "../http/client";
import type { IProductRepository, ListQuery } from "@/domain/repositories";
import type { ApiEnvelope, Product, StockMovement } from "@/domain/entities";
import { listQueryParams, queryString } from "./query-string";

export class ProductRepository implements IProductRepository {
  async list(query: ListQuery) {
    const params = listQueryParams(query);
    const { data } = await http.get<ApiEnvelope<Product[]>>(
      `/products${queryString(params)}`,
    );
    return data;
  }

  async filter(query: ListQuery) {
    const { data } = await http.post<ApiEnvelope<Product[]>>(
      "/products/filter",
      query,
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

  async listMovements(id: string, query: ListQuery) {
    const { data } = await http.get<ApiEnvelope<StockMovement[]>>(
      `/products/${id}/stock-movements${queryString(listQueryParams(query))}`,
    );
    return data;
  }
}
