import type { ApiEnvelope, Customer } from "../entities";
import type { ListQuery } from "./common.repository";

export interface ICustomerRepository {
  list(query: ListQuery): Promise<ApiEnvelope<Customer[]>>;
  filter(query: ListQuery): Promise<ApiEnvelope<Customer[]>>;
  get(id: string): Promise<ApiEnvelope<Customer>>;
  create(payload: Partial<Customer>): Promise<ApiEnvelope<Customer>>;
  update(
    id: string,
    payload: Partial<Customer>,
  ): Promise<ApiEnvelope<Customer>>;
  remove(id: string): Promise<void>;
}
