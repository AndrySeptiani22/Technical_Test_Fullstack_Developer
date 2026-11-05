import { http } from "../http/client";
import type { ICustomerRepository, ListQuery } from "@/domain/repositories";
import type { ApiEnvelope, Customer } from "@/domain/entities";
import { listQueryParams, queryString } from "./query-string";

export class CustomerRepository implements ICustomerRepository {
  async list(query: ListQuery) {
    const params = listQueryParams(query);
    const { data } = await http.get<ApiEnvelope<Customer[]>>(
      `/customers${queryString(params)}`,
    );
    return data;
  }

  async filter(query: ListQuery) {
    const { data } = await http.post<ApiEnvelope<Customer[]>>(
      "/customers/filter",
      query,
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
