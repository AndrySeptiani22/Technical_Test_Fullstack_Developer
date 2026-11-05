import type {
  IProductRepository,
  ListQuery,
} from "@application/abstract/repositories/icatalog.repository";
import type { Product } from "@domain/entities";

export class ProductUseCase {
  constructor(private readonly repository: IProductRepository) {}
  list(query: ListQuery) {
    return this.repository.list(query);
  }
  getById(id: string) {
    return this.repository.getById(id);
  }
  create(
    input: Pick<
      Product,
      "productCode" | "productName" | "stock" | "price" | "lowStockThreshold"
    >,
  ) {
    return this.repository.create(input);
  }
  update(
    id: string,
    input: Partial<
      Pick<
        Product,
        "productCode" | "productName" | "price" | "lowStockThreshold"
      >
    >,
  ) {
    return this.repository.update(id, input);
  }
  delete(id: string) {
    return this.repository.softDelete(id);
  }
  adjustStock(id: string, delta: number, note: string, userId: string) {
    return this.repository.adjustStock(id, delta, note, userId);
  }
  movements(id: string, query: Pick<ListQuery, "page" | "limit">) {
    return this.repository.movements(id, query);
  }
}
