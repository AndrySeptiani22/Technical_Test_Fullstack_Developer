import assert from "node:assert/strict";
import test from "node:test";
import type { IProductRepository } from "@application/abstract/repositories/icatalog.repository";
import { Product } from "@domain/entities/product.entity";
import { ProductUseCase } from "@application/use-cases/products/product.use-case";

async function assertDelegatedRejection(
  action: Promise<unknown>,
  error: Error,
): Promise<void> {
  await assert.rejects(action, (received) => received === error);
}

test("ProductUseCase delegates all product operations with unchanged arguments", async () => {
  const error = new Error("repository failure");
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const reject = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
    return Promise.reject(error);
  };
  const repository: IProductRepository = {
    list: reject("list"),
    getById: reject("getById"),
    create: reject("create"),
    update: reject("update"),
    softDelete: reject("softDelete"),
    adjustStock: reject("adjustStock"),
    movements: reject("movements"),
  };
  const useCase = new ProductUseCase(repository);
  const query = { page: 2, limit: 25, search: "mouse", sortBy: "price" };
  const product = {
    productCode: "PRD-1",
    productName: "Mouse",
    stock: 5,
    price: "10.00",
    lowStockThreshold: 2,
  };
  const update = { productName: "New mouse", price: "12.00" };
  const movementQuery = { page: 3, limit: 10 };

  await assertDelegatedRejection(useCase.list(query), error);
  await assertDelegatedRejection(useCase.getById("17"), error);
  await assertDelegatedRejection(useCase.create(product), error);
  await assertDelegatedRejection(useCase.update("17", update), error);
  await assertDelegatedRejection(useCase.delete("17"), error);
  await assertDelegatedRejection(
    useCase.adjustStock("17", -2, "damaged", "user-1"),
    error,
  );
  await assertDelegatedRejection(useCase.movements("17", movementQuery), error);

  assert.deepEqual(calls, [
    { method: "list", args: [query] },
    { method: "getById", args: ["17"] },
    { method: "create", args: [product] },
    { method: "update", args: ["17", update] },
    { method: "softDelete", args: ["17"] },
    { method: "adjustStock", args: ["17", -2, "damaged", "user-1"] },
    { method: "movements", args: ["17", movementQuery] },
  ]);
});

test("ProductUseCase returns successful results and preserves empty or missing results", async () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const product = Object.assign(new Product(), {
    productId: "product-1",
    productCode: "PRD-1",
    productName: "Mouse",
    stock: 5,
    price: "10.00",
    lowStockThreshold: 2,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    orderItems: [],
    stockMovements: [],
  });
  const listResult = { items: [product], meta: { page: 1, total: 1 } };
  const emptyListResult = { items: [], meta: { page: 1, total: 0 } };
  const query = { page: 1, limit: 20, search: "mouse" };
  const createInput = {
    productCode: "PRD-1",
    productName: "Mouse",
    stock: 5,
    price: "10.00",
    lowStockThreshold: 2,
  };
  const updateInput = { productName: "Wireless Mouse" };
  const movementQuery = { page: 1, limit: 20 };
  const emptyMovements = { items: [], meta: { page: 1, total: 0 } };
  const repository: IProductRepository = {
    list: async (...args) => {
      calls.push({ method: "list", args });
      return args[0].search === "no matches" ? emptyListResult : listResult;
    },
    getById: async (...args) => {
      calls.push({ method: "getById", args });
      return args[0] === "product-1" ? product : null;
    },
    create: async (...args) => {
      calls.push({ method: "create", args });
      return product;
    },
    update: async (...args) => {
      calls.push({ method: "update", args });
      return product;
    },
    softDelete: async (...args) => {
      calls.push({ method: "softDelete", args });
    },
    adjustStock: async (...args) => {
      calls.push({ method: "adjustStock", args });
      return product;
    },
    movements: async (...args) => {
      calls.push({ method: "movements", args });
      return emptyMovements;
    },
  };
  const useCase = new ProductUseCase(repository);

  assert.equal(await useCase.list(query), listResult);
  assert.equal(await useCase.list({ ...query, search: "no matches" }), emptyListResult);
  assert.equal(await useCase.getById("product-1"), product);
  assert.equal(await useCase.getById("missing"), null);
  assert.equal(await useCase.create(createInput), product);
  assert.equal(await useCase.update("product-1", updateInput), product);
  assert.equal(await useCase.delete("product-1"), undefined);
  assert.equal(await useCase.adjustStock("product-1", 3, "Restock", "user-1"), product);
  assert.equal(await useCase.movements("product-1", movementQuery), emptyMovements);
  assert.deepEqual(calls, [
    { method: "list", args: [query] },
    { method: "list", args: [{ ...query, search: "no matches" }] },
    { method: "getById", args: ["product-1"] },
    { method: "getById", args: ["missing"] },
    { method: "create", args: [createInput] },
    { method: "update", args: ["product-1", updateInput] },
    { method: "softDelete", args: ["product-1"] },
    { method: "adjustStock", args: ["product-1", 3, "Restock", "user-1"] },
    { method: "movements", args: ["product-1", movementQuery] },
  ]);
});
