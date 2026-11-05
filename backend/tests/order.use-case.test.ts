import assert from "node:assert/strict";
import test from "node:test";
import type { IOrderRepository } from "@application/abstract/repositories/iorder.repository";
import { Order } from "@domain/entities/order.entity";
import { OrderUseCase } from "@application/use-cases/orders/order.use-case";

async function assertDelegatedRejection(
  action: Promise<unknown>,
  error: Error,
): Promise<void> {
  await assert.rejects(action, (received) => received === error);
}

test("OrderUseCase delegates order creation, transitions, reads, and filters", async () => {
  const error = new Error("repository failure");
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const reject = (method: string) => (...args: unknown[]) => {
    calls.push({ method, args });
    return Promise.reject(error);
  };
  const repository: IOrderRepository = {
    createWithStockReservation: reject("createWithStockReservation"),
    transition: reject("transition"),
    findById: reject("findById"),
    list: reject("list"),
  };
  const useCase = new OrderUseCase(repository);
  const create = {
    userId: "user-1",
    idempotencyKey: "50cce154-6d63-4dc4-a7f9-41b8e4edaf57",
    customerId: "customer-1",
    items: [{ productId: "product-1", quantity: 2 }],
  };
  const transition = {
    orderId: "order-1",
    userId: "user-1",
    role: "admin" as const,
    action: "cancel" as const,
    reason: "requested",
  };
  const query = {
    page: 1,
    limit: 20,
    status: "PENDING",
    customerId: "customer-1",
    from: "2026-01-01",
    to: "2026-01-31",
  };

  await assertDelegatedRejection(useCase.create(create), error);
  await assertDelegatedRejection(useCase.transition(transition), error);
  await assertDelegatedRejection(useCase.getById("order-1"), error);
  await assertDelegatedRejection(useCase.list(query), error);

  assert.deepEqual(calls, [
    { method: "createWithStockReservation", args: [create] },
    { method: "transition", args: [transition] },
    { method: "findById", args: ["order-1"] },
    { method: "list", args: [query] },
  ]);
});

test("OrderUseCase creates a fresh UUID idempotency key", () => {
  const first = OrderUseCase.newIdempotencyKey();
  const second = OrderUseCase.newIdempotencyKey();
  const uuidV4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  assert.match(first, uuidV4);
  assert.match(second, uuidV4);
  assert.notEqual(first, second);
});

test("OrderUseCase returns successful results and preserves replay and not-found cases", async () => {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const order = Object.assign(new Order(), {
    orderId: "order-1",
    orderNumber: "INV-20260101-0001",
    customerId: "customer-1",
    createdBy: "user-1",
    status: "PENDING" as const,
    totalAmount: "20.00",
    orderDate: new Date("2026-01-01T00:00:00.000Z"),
    paidAt: null,
    shippedAt: null,
    completedAt: null,
    cancelledAt: null,
    cancelReason: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  });
  const firstCreateResult = {
    order,
    replayed: false,
    responseBody: { success: true, data: { id: "order-1" } },
    responseStatus: 201,
  };
  const replayResult = {
    ...firstCreateResult,
    replayed: true,
    responseStatus: 200,
  };
  const query = { page: 1, limit: 20, status: "PENDING" };
  const listResult = { items: [order], meta: { page: 1, total: 1 } };
  const emptyListResult = { items: [], meta: { page: 1, total: 0 } };
  const createInput = {
    userId: "user-1",
    idempotencyKey: "50cce154-6d63-4dc4-a7f9-41b8e4edaf57",
    customerId: "customer-1",
    items: [{ productId: "product-1", quantity: 2 }],
  };
  const transitionInput = {
    orderId: "order-1",
    userId: "user-1",
    role: "admin" as const,
    action: "pay" as const,
  };
  const repository: IOrderRepository = {
    createWithStockReservation: async (...args) => {
      calls.push({ method: "createWithStockReservation", args });
      return args[0].idempotencyKey === "replayed-key"
        ? replayResult
        : firstCreateResult;
    },
    transition: async (...args) => {
      calls.push({ method: "transition", args });
      return order;
    },
    findById: async (...args) => {
      calls.push({ method: "findById", args });
      return args[0] === "order-1" ? order : null;
    },
    list: async (...args) => {
      calls.push({ method: "list", args });
      return args[0].status === "MISSING" ? emptyListResult : listResult;
    },
  };
  const useCase = new OrderUseCase(repository);

  assert.equal(await useCase.create(createInput), firstCreateResult);
  assert.equal(await useCase.create({ ...createInput, idempotencyKey: "replayed-key" }), replayResult);
  assert.equal(await useCase.transition(transitionInput), order);
  assert.equal(await useCase.getById("order-1"), order);
  assert.equal(await useCase.getById("missing"), null);
  assert.equal(await useCase.list(query), listResult);
  assert.equal(await useCase.list({ ...query, status: "MISSING" }), emptyListResult);
  assert.deepEqual(calls, [
    { method: "createWithStockReservation", args: [createInput] },
    {
      method: "createWithStockReservation",
      args: [{ ...createInput, idempotencyKey: "replayed-key" }],
    },
    { method: "transition", args: [transitionInput] },
    { method: "findById", args: ["order-1"] },
    { method: "findById", args: ["missing"] },
    { method: "list", args: [query] },
    { method: "list", args: [{ ...query, status: "MISSING" }] },
  ]);
});
