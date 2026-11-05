import type {
  ICustomerRepository,
  ListQuery,
} from "@application/abstract/repositories/icatalog.repository";
import type { Customer } from "@domain/entities";

export class CustomerUseCase {
  constructor(private readonly repository: ICustomerRepository) {}
  list(query: ListQuery) {
    return this.repository.list(query);
  }
  getById(id: string) {
    return this.repository.getById(id);
  }
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
  ) {
    return this.repository.create(input);
  }
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
  ) {
    return this.repository.update(id, input);
  }
  delete(id: string) {
    return this.repository.softDelete(id);
  }
}
