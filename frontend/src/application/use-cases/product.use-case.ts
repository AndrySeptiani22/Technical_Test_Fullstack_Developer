import { repositories } from "@/infrastructure/repositories";
import type { Product } from "@/domain/entities";
import type { ListQuery } from "@/domain/repositories";

export const listProducts = (query: ListQuery) =>
  repositories.products.list(query);
export const filterProducts = (query: ListQuery) =>
  repositories.products.filter(query);
export const getProduct = (id: string) => repositories.products.get(id);
export const createProduct = (payload: Partial<Product>) =>
  repositories.products.create(payload);
export const updateProduct = (id: string, payload: Partial<Product>) =>
  repositories.products.update(id, payload);
export const deleteProduct = (id: string) => repositories.products.remove(id);
export const adjustStock = (id: string, change: number, note: string) =>
  repositories.products.adjustStock(id, change, note);
export const listStockMovements = (id: string, query: ListQuery) =>
  repositories.products.listMovements(id, query);
