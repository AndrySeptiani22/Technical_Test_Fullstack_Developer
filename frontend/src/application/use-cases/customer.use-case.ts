import { repositories } from "@/infrastructure/repositories";
import type { Customer } from "@/domain/entities";
import type { ListQuery } from "@/domain/repositories";

export const listCustomers = (query: ListQuery) =>
  repositories.customers.list(query);
export const filterCustomers = (query: ListQuery) =>
  repositories.customers.filter(query);
export const getCustomer = (id: string) => repositories.customers.get(id);
export const createCustomer = (payload: Partial<Customer>) =>
  repositories.customers.create(payload);
export const updateCustomer = (id: string, payload: Partial<Customer>) =>
  repositories.customers.update(id, payload);
export const deleteCustomer = (id: string) =>
  repositories.customers.remove(id);
