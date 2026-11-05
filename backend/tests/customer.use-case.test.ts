import assert from "node:assert/strict";
import test from "node:test";
import type { ICustomerRepository } from "@application/abstract/repositories/icatalog.repository";
import { Customer } from "@domain/entities/customer.entity";
import { CustomerUseCase } from "@application/use-cases/customers/customer.use-case";

async function assertDelegatedRejection(
  action: Promise<unknown>,
  error: Error,
): Promise<void> {
  await assert.rejects(action, (received) => received === error);
}

test("CustomerUseCase delegates all customer operations with unchanged arguments", async () => {
  const error = new Error("repository failure");
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const reject = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
    return Promise.reject(error);
  };
  const repository: ICustomerRepository = {
    list: reject("list"),
    getById: reject("getById"),
    create: reject("create"),
    update: reject("update"),
    softDelete: reject("softDelete"),
  };
  const useCase = new CustomerUseCase(repository);
  const query = { page: 1, limit: 20 };
  const customer = {
    customerName: "Ayu",
    customerAddress: "Jakarta",
    gender: "FEMALE" as const,
    birthDate: "1995-06-15",
    phone: null,
    email: "ayu@example.com",
  };
  const update = { email: null };

  await assertDelegatedRejection(useCase.list(query), error);
  await assertDelegatedRejection(useCase.getById("customer-1"), error);
  await assertDelegatedRejection(useCase.create(customer), error);
  await assertDelegatedRejection(useCase.update("customer-1", update), error);
  await assertDelegatedRejection(useCase.delete("customer-1"), error);

  assert.deepEqual(calls, [
    { method: "list", args: [query] },
    { method: "getById", args: ["customer-1"] },
    { method: "create", args: [customer] },
    { method: "update", args: ["customer-1", update] },
    { method: "softDelete", args: ["customer-1"] },
  ]);
});

test("CustomerUseCase returns successful results and preserves empty or missing results", async () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const customer = Object.assign(new Customer(), {
    customerId: "customer-1",
    customerName: "Ayu",
    customerAddress: "Jakarta",
    gender: "FEMALE" as const,
    birthDate: "1995-06-15",
    phone: null,
    email: "ayu@example.com",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    deletedAt: null,
    orders: [],
  });
  const listResult = { items: [customer], meta: { page: 1, total: 1 } };
  const emptyListResult = { items: [], meta: { page: 1, total: 0 } };
  const query = { page: 1, limit: 20 };
  const createdInput = {
    customerName: "Ayu",
    customerAddress: "Jakarta",
    gender: "FEMALE" as const,
    birthDate: "1995-06-15",
    phone: null,
    email: "ayu@example.com",
  };
  const updateInput = { email: "new@example.com" };
  const repository: ICustomerRepository = {
    list: async (...args) => {
      calls.push({ method: "list", args });
      return args[0].search ? emptyListResult : listResult;
    },
    getById: async (...args) => {
      calls.push({ method: "getById", args });
      return args[0] === "customer-1" ? customer : null;
    },
    create: async (...args) => {
      calls.push({ method: "create", args });
      return customer;
    },
    update: async (...args) => {
      calls.push({ method: "update", args });
      return customer;
    },
    softDelete: async (...args) => {
      calls.push({ method: "softDelete", args });
    },
  };
  const useCase = new CustomerUseCase(repository);

  assert.equal(await useCase.list(query), listResult);
  assert.equal(await useCase.list({ ...query, search: "no matches" }), emptyListResult);
  assert.equal(await useCase.getById("customer-1"), customer);
  assert.equal(await useCase.getById("missing"), null);
  assert.equal(await useCase.create(createdInput), customer);
  assert.equal(await useCase.update("customer-1", updateInput), customer);
  assert.equal(await useCase.delete("customer-1"), undefined);
  assert.deepEqual(calls, [
    { method: "list", args: [query] },
    { method: "list", args: [{ ...query, search: "no matches" }] },
    { method: "getById", args: ["customer-1"] },
    { method: "getById", args: ["missing"] },
    { method: "create", args: [createdInput] },
    { method: "update", args: ["customer-1", updateInput] },
    { method: "softDelete", args: ["customer-1"] },
  ]);
});
