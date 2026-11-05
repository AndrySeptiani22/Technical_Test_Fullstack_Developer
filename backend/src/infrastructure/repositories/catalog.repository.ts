import { DataSource, IsNull, type FindOptionsWhere } from "typeorm";
import type {
  IProductRepository,
  ICustomerRepository,
  ListQuery,
} from "@application/abstract/repositories/icatalog.repository";
import { Customer, Product, StockMovement } from "@domain/entities";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@application/models/error/application.error";
import { applyListFilters } from "./list-filters";
import type { FilterFieldMap } from "./list-filters";

const productFilterFields: FilterFieldMap = {
  product_code: { expression: "product.productCode", kind: "text" },
  product_name: { expression: "product.productName", kind: "text" },
  stock: { expression: "product.stock", kind: "number" },
  price: { expression: "product.price", kind: "number" },
  low_stock_threshold: {
    expression: "product.lowStockThreshold",
    kind: "number",
  },
};

const customerFilterFields: FilterFieldMap = {
  customer_name: { expression: "customer.customerName", kind: "text" },
  email: { expression: "customer.email", kind: "text" },
  phone: { expression: "customer.phone", kind: "text" },
  customer_address: { expression: "customer.customerAddress", kind: "text" },
};

export class ProductRepository implements IProductRepository {
  constructor(private readonly dataSource: DataSource) {}

  async list(query: ListQuery) {
    const allowedSort = new Set([
      "productName",
      "productCode",
      "price",
      "stock",
      "createdAt",
    ]);
    const sort = allowedSort.has(query.sortBy ?? "")
      ? query.sortBy!
      : "productName";
    const qb = this.dataSource
      .getRepository(Product)
      .createQueryBuilder("product")
      .where("product.deletedAt IS NULL");
    if (query.search?.trim()) {
      qb.andWhere(
        "(LOWER(product.productName) LIKE LOWER(:search) OR LOWER(product.productCode) LIKE LOWER(:search))",
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }
    applyListFilters(qb, query.filters, productFilterFields);
    qb.orderBy(`product.${sort}`, query.sortOrder ?? "ASC").addOrderBy(
      "product.productId",
      "ASC",
    );
    if (!query.all)
      qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: {
        page: query.page,
        per_page: query.all ? total : query.limit,
        total,
        total_pages: query.all ? (total > 0 ? 1 : 0) : Math.ceil(total / query.limit),
      },
    };
  }

  getById(productId: string) {
    return this.dataSource
      .getRepository(Product)
      .findOne({ where: { productId, deletedAt: IsNull() } });
  }

  async create(
    input: Pick<
      Product,
      "productCode" | "productName" | "stock" | "price" | "lowStockThreshold"
    >,
  ) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const product = await manager
          .getRepository(Product)
          .save({ ...input, deletedAt: null });
        if (product.stock > 0) {
          await manager.getRepository(StockMovement).save({
            productId: product.productId,
            type: "INITIAL",
            quantityChange: product.stock,
            stockAfter: product.stock,
            referenceType: "product",
            referenceId: product.productId,
            note: "Initial stock",
            createdBy: null,
          });
        }
        return product;
      });
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError("Product code already exists.");
      throw error;
    }
  }

  async update(
    productId: string,
    input: Partial<
      Pick<
        Product,
        "productCode" | "productName" | "price" | "lowStockThreshold"
      >
    >,
  ) {
    const repo = this.dataSource.getRepository(Product);
    const product = await this.getById(productId);
    if (!product) throw new NotFoundError("Product not found.");
    Object.assign(product, input);
    try {
      return await repo.save(product);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictError("Product code already exists.");
      throw error;
    }
  }

  async softDelete(productId: string): Promise<void> {
    const repo = this.dataSource.getRepository(Product);
    const product = await this.getById(productId);
    if (!product) throw new NotFoundError("Product not found.");
    product.deletedAt = new Date();
    await repo.save(product);
  }

  async adjustStock(
    productId: string,
    quantityChange: number,
    note: string,
    userId: string,
  ) {
    if (!Number.isSafeInteger(quantityChange) || quantityChange === 0) {
      throw new ValidationError("quantity_change must be a non-zero integer.", {
        quantity_change: ["quantity_change must be a non-zero integer."],
      });
    }
    if (!note.trim())
      throw new ValidationError("Stock adjustment note is required.");
    return this.dataSource.transaction("READ COMMITTED", async (manager) => {
      const product = await manager.getRepository(Product).findOne({
        where: { productId, deletedAt: IsNull() },
        lock: { mode: "pessimistic_write" },
      });
      if (!product) throw new NotFoundError("Product not found.");
      const nextStock = product.stock + quantityChange;
      if (nextStock < 0 || nextStock > 2_147_483_647)
        throw new ValidationError(
          "Stock adjustment is outside the supported stock range.",
          {
            quantity_change: [
              `Current stock is ${product.stock}; adjustment would result in ${nextStock}.`,
            ],
          },
        );
      product.stock = nextStock;
      await manager.getRepository(Product).save(product);
      await manager.getRepository(StockMovement).save({
        productId,
        type: "ADJUSTMENT",
        quantityChange,
        stockAfter: nextStock,
        referenceType: "manual_adjustment",
        referenceId: null,
        note: note.trim(),
        createdBy: userId,
      });
      return product;
    });
  }

  async movements(productId: string, query: Pick<ListQuery, "page" | "limit">) {
    if (!(await this.getById(productId)))
      throw new NotFoundError("Product not found.");
    const [items, total] = await this.dataSource
      .getRepository(StockMovement)
      .findAndCount({
        where: { productId } as FindOptionsWhere<StockMovement>,
        order: { createdAt: "DESC", stockMovementId: "DESC" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      });
    return {
      items,
      meta: {
        page: query.page,
        per_page: query.limit,
        total,
        total_pages: Math.ceil(total / query.limit),
      },
    };
  }
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private readonly dataSource: DataSource) {}

  async list(query: ListQuery) {
    const allowedSort = new Set(["customerName", "createdAt", "email"]);
    const sort = allowedSort.has(query.sortBy ?? "")
      ? query.sortBy!
      : "customerName";
    const qb = this.dataSource
      .getRepository(Customer)
      .createQueryBuilder("customer")
      .where("customer.deletedAt IS NULL");
    if (query.search?.trim()) {
      qb.andWhere(
        "(LOWER(customer.customerName) LIKE LOWER(:search) OR LOWER(COALESCE(customer.email, '')) LIKE LOWER(:search) OR customer.phone LIKE :search)",
        {
          search: `%${query.search.trim()}%`,
        },
      );
    }
    applyListFilters(qb, query.filters, customerFilterFields);
    qb.orderBy(`customer.${sort}`, query.sortOrder ?? "ASC").addOrderBy(
      "customer.customerId",
      "ASC",
    );
    if (!query.all)
      qb.skip((query.page - 1) * query.limit).take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      meta: {
        page: query.page,
        per_page: query.all ? total : query.limit,
        total,
        total_pages: query.all ? (total > 0 ? 1 : 0) : Math.ceil(total / query.limit),
      },
    };
  }

  getById(customerId: string) {
    return this.dataSource
      .getRepository(Customer)
      .findOne({ where: { customerId, deletedAt: IsNull() } });
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
    return this.dataSource
      .getRepository(Customer)
      .save({ ...input, deletedAt: null });
  }

  async update(
    customerId: string,
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
    const repo = this.dataSource.getRepository(Customer);
    const customer = await this.getById(customerId);
    if (!customer) throw new NotFoundError("Customer not found.");
    Object.assign(customer, input);
    return repo.save(customer);
  }

  async softDelete(customerId: string) {
    const repo = this.dataSource.getRepository(Customer);
    const customer = await this.getById(customerId);
    if (!customer) throw new NotFoundError("Customer not found.");
    customer.deletedAt = new Date();
    await repo.save(customer);
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}
