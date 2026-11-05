import { createHash } from "crypto";
import { DataSource, EntityManager, IsNull } from "typeorm";
import type {
  IOrderRepository,
  CreateOrderInput,
  OrderTransitionInput,
} from "@application/abstract/repositories/iorder.repository";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@application/models/error/application.error";
import {
  Customer,
  IdempotencyKey,
  Notification,
  Order,
  OrderItem,
  OrderStatusHistory,
  Product,
  StockMovement,
  User,
} from "@domain/entities";
import { resolveOrderTransition } from "@domain/services/order-state-machine";
import { calculateOrderTotal } from "@domain/services/order-calculation";
import { serializeOrder } from "@application/models/response/order.response";

const IDEMPOTENCY_TTL_HOURS = 24;

function jakartaDatePart(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}

function canonicalHash(input: CreateOrderInput): string {
  const items = [...input.items]
    .map((item) => ({
      productId: String(item.productId),
      quantity: item.quantity,
    }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
  return createHash("sha256")
    .update(JSON.stringify({ customerId: input.customerId, items }))
    .digest("hex");
}

function aggregateItems(
  items: CreateOrderInput["items"],
): Array<{ productId: string; quantity: number }> {
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new ValidationError(
        "Every order quantity must be a positive integer.",
        {
          items: ["Every order quantity must be a positive integer."],
        },
      );
    }
    const productId = String(item.productId);
    const nextQuantity = (quantities.get(productId) ?? 0) + item.quantity;
    if (!Number.isSafeInteger(nextQuantity) || nextQuantity > 2_147_483_647) {
      throw new ValidationError(
        "Combined product quantity exceeds the supported integer range.",
      );
    }
    quantities.set(productId, nextQuantity);
  }
  return [...quantities.entries()]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
}

export class OrderRepository implements IOrderRepository {
  constructor(private readonly dataSource: DataSource) {}

  async createWithStockReservation(input: CreateOrderInput): Promise<{
    order: Order;
    replayed: boolean;
    responseBody: unknown;
    responseStatus: number;
  }> {
    return this.dataSource.transaction("READ COMMITTED", async (manager) => {
      const items = aggregateItems(input.items);
      const requestHash = canonicalHash({ ...input, items });
      const idempotencyRepo = manager.getRepository(IdempotencyKey);
      const now = new Date();
      let existing = await idempotencyRepo.findOne({
        where: { userId: input.userId, idempotencyKey: input.idempotencyKey },
        lock: { mode: "pessimistic_write" },
      });

      if (existing && existing.expiresAt <= now) {
        await idempotencyRepo.delete({ idempotencyId: existing.idempotencyId });
        existing = null;
      }

      if (existing) {
        if (existing.requestHash !== requestHash) {
          throw new ConflictError(
            "Idempotency-Key has already been used with a different request payload.",
          );
        }
        if (existing.status === "PROCESSING") {
          throw new ConflictError(
            "A request with this Idempotency-Key is still being processed.",
          );
        }
        if (!existing.orderId)
          throw new ConflictError(
            "The stored idempotent response is unavailable.",
          );
        const replay = await manager.getRepository(Order).findOne({
          where: { orderId: existing.orderId },
          relations: {
            items: { product: true },
            customer: true,
            history: true,
          },
        });
        if (!replay)
          throw new ConflictError(
            "The order for this Idempotency-Key no longer exists.",
          );
        return {
          order: replay,
          replayed: true,
          responseBody: existing.responseBody,
          responseStatus: existing.responseStatus ?? 201,
        };
      }

      const insertResult = await manager
        .createQueryBuilder()
        .insert()
        .into(IdempotencyKey)
        .values({
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          requestHash,
          status: "PROCESSING",
          expiresAt: new Date(
            now.getTime() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000,
          ),
        })
        .orIgnore()
        .returning(["IDEMPOTENCY_ID"])
        .execute();

      if (!insertResult.raw?.length) {
        // A concurrent request inserted the same key. It will become visible after its transaction commits.
        const concurrent = await idempotencyRepo.findOne({
          where: { userId: input.userId, idempotencyKey: input.idempotencyKey },
          lock: { mode: "pessimistic_write" },
        });
        if (!concurrent)
          throw new ConflictError(
            "Idempotency-Key is currently being processed.",
          );
        if (concurrent.requestHash !== requestHash) {
          throw new ConflictError(
            "Idempotency-Key has already been used with a different request payload.",
          );
        }
        if (concurrent.status !== "COMPLETED" || !concurrent.orderId) {
          throw new ConflictError(
            "A request with this Idempotency-Key is still being processed.",
          );
        }
        const replay = await manager.getRepository(Order).findOne({
          where: { orderId: concurrent.orderId },
          relations: {
            items: { product: true },
            customer: true,
            history: true,
          },
        });
        if (!replay)
          throw new ConflictError(
            "The order for this Idempotency-Key no longer exists.",
          );
        return {
          order: replay,
          replayed: true,
          responseBody: concurrent.responseBody,
          responseStatus: concurrent.responseStatus ?? 201,
        };
      }

      const customer = await manager.getRepository(Customer).findOne({
        where: { customerId: input.customerId, deletedAt: IsNull() },
      });
      if (!customer) throw new NotFoundError("Customer not found.");

      const productIds = items.map((item) => item.productId);
      const lockedProducts = productIds.length
        ? await manager
            .getRepository(Product)
            .createQueryBuilder("product")
            .where("product.productId IN (:...productIds)", { productIds })
            .andWhere("product.deletedAt IS NULL")
            .orderBy("product.productId", "ASC")
            .setLock("pessimistic_write")
            .getMany()
        : [];
      const productsById = new Map(
        lockedProducts.map((product) => [product.productId, product]),
      );
      const missing = items.filter((item) => !productsById.has(item.productId));
      if (missing.length) {
        throw new ValidationError("One or more products are unavailable.", {
          items: missing.map(
            (item) =>
              `Product ${item.productId} does not exist or is inactive.`,
          ),
        });
      }

      for (const item of items) {
        const product = productsById.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new ValidationError("Insufficient stock.", {
            [`items.${item.productId}.quantity`]: [
              `Stock for ${product.productName} is ${product.stock}, requested ${item.quantity}.`,
            ],
          });
        }
      }

      const calculated = calculateOrderTotal(
        items.map((item) => ({
          ...item,
          price: productsById.get(item.productId)!.price,
        })),
      );
      const orderDate = new Date();
      const orderRepo = manager.getRepository(Order);
      const insertedOrder = await orderRepo
        .createQueryBuilder()
        .insert()
        .values({
          customerId: input.customerId,
          createdBy: input.userId,
          status: "PENDING",
          totalAmount: calculated.totalAmount,
          orderDate,
          paidAt: null,
          shippedAt: null,
          completedAt: null,
          cancelledAt: null,
          cancelReason: null,
        })
        .returning(["orderId", "orderNumber"])
        .execute();
      const orderId = insertedOrder.identifiers[0]?.orderId;
      if (!orderId)
        throw new Error("Order insert did not return its generated ID.");
      const order = await orderRepo.findOne({ where: { orderId } });
      if (!order?.orderNumber)
        throw new Error(
          "Order number trigger did not generate an invoice number.",
        );

      const orderItems = calculated.lines.map((line) =>
        manager.getRepository(OrderItem).create({
          orderId: order.orderId,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          subtotal: line.subtotal,
        }),
      );
      await manager.getRepository(OrderItem).save(orderItems);

      for (const item of items) {
        const product = productsById.get(item.productId)!;
        const stockBefore = product.stock;
        product.stock -= item.quantity;
        await manager.getRepository(Product).save(product);
        await manager.getRepository(StockMovement).save({
          productId: product.productId,
          type: "ORDER_OUT",
          quantityChange: -item.quantity,
          stockAfter: product.stock,
          referenceType: "order",
          referenceId: order.orderId,
          note: `Stock reserved for ${order.orderNumber}`,
          createdBy: input.userId,
        });
        if (
          stockBefore >= product.lowStockThreshold &&
          product.stock < product.lowStockThreshold
        ) {
          await this.createLowStockNotifications(manager, product);
        }
      }

      await manager.getRepository(OrderStatusHistory).save({
        orderId: order.orderId,
        fromStatus: null,
        toStatus: "PENDING",
        reason: "Order created",
        createdBy: input.userId,
      });

      const created = await orderRepo.findOne({
        where: { orderId: order.orderId },
        relations: { items: { product: true }, customer: true, history: true },
      });
      if (!created) throw new Error("Created order could not be reloaded.");
      const responseBody = {
        success: true,
        message: "Order created.",
        data: serializeOrder(created),
      };
      await idempotencyRepo.update(
        { userId: input.userId, idempotencyKey: input.idempotencyKey },
        {
          status: "COMPLETED",
          responseStatus: 201,
          responseBody,
          orderId: order.orderId,
        },
      );
      return {
        order: created,
        replayed: false,
        responseBody,
        responseStatus: 201,
      };
    });
  }

  async transition(input: OrderTransitionInput): Promise<Order> {
    return this.dataSource.transaction("READ COMMITTED", async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const order = await orderRepo.findOne({
        where: { orderId: input.orderId },
        lock: { mode: "pessimistic_write" },
      });
      if (!order) throw new NotFoundError("Order not found.");
      const nextStatus = resolveOrderTransition(
        order.status,
        input.action,
        input.role,
        input.reason,
      );
      const previousStatus = order.status;
      const now = new Date();

      if (input.action === "pay") {
        order.paidAt = now;
        const customer = await manager
          .getRepository(Customer)
          .findOne({ where: { customerId: order.customerId } });
        if (customer?.email) {
          await manager
            .getRepository(Notification)
            .createQueryBuilder()
            .insert()
            .values({
              type: "ORDER_INVOICE_EMAIL",
              dedupeKey: `order-invoice:${order.orderId}`,
              recipientUserId: null,
              recipientEmail: customer.email,
              payload: {
                orderId: order.orderId,
                orderNumber: order.orderNumber,
              },
            })
            .orIgnore()
            .execute();
        }
      }
      if (input.action === "ship") order.shippedAt = now;
      if (input.action === "complete") order.completedAt = now;
      if (input.action === "cancel") {
        order.cancelledAt = now;
        order.cancelReason = input.reason!.trim();
        const items = await manager
          .getRepository(OrderItem)
          .find({ where: { orderId: order.orderId } });
        const productIds = [
          ...new Set(items.map((item) => item.productId)),
        ].sort((a, b) => a.localeCompare(b));
        const products = productIds.length
          ? await manager
              .getRepository(Product)
              .createQueryBuilder("product")
              .where("product.productId IN (:...productIds)", { productIds })
              .orderBy("product.productId", "ASC")
              .setLock("pessimistic_write")
              .getMany()
          : [];
        const productMap = new Map(
          products.map((product) => [product.productId, product]),
        );
        for (const item of items) {
          const product = productMap.get(item.productId);
          if (!product)
            throw new ConflictError(
              `Product ${item.productId} is missing; stock cannot be restored.`,
            );
          product.stock += item.quantity;
          if (product.stock > 2_147_483_647) {
            throw new ConflictError(
              `Restoring stock for product ${product.productId} exceeds the supported integer range.`,
            );
          }
          await manager.getRepository(Product).save(product);
          await manager.getRepository(StockMovement).save({
            productId: product.productId,
            type: "CANCEL_RESTORE",
            quantityChange: item.quantity,
            stockAfter: product.stock,
            referenceType: "order",
            referenceId: order.orderId,
            note: `Stock restored for ${order.orderNumber}`,
            createdBy: input.userId,
          });
        }
      }

      order.status = nextStatus;
      await orderRepo.save(order);
      await manager.getRepository(OrderStatusHistory).save({
        orderId: order.orderId,
        fromStatus: previousStatus,
        toStatus: nextStatus,
        reason: input.action === "cancel" ? input.reason!.trim() : null,
        createdBy: input.userId,
      });
      const updated = await orderRepo.findOne({
        where: { orderId: order.orderId },
        relations: { items: { product: true }, customer: true, history: true },
      });
      if (!updated) throw new Error("Updated order could not be reloaded.");
      return updated;
    });
  }

  async list(query: {
    page: number;
    limit: number;
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
  }) {
    const qb = this.dataSource
      .getRepository(Order)
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "items")
      .leftJoinAndSelect("order.customer", "customer");
    if (query.status)
      qb.andWhere("order.status = :status", { status: query.status });
    if (query.customerId)
      qb.andWhere("order.customerId = :customerId", {
        customerId: query.customerId,
      });
    if (query.from)
      qb.andWhere(
        "order.orderDate >= (CAST(:from AS date)::timestamp AT TIME ZONE 'Asia/Jakarta')",
        { from: query.from },
      );
    if (query.to)
      qb.andWhere(
        "order.orderDate < ((CAST(:to AS date) + interval '1 day')::timestamp AT TIME ZONE 'Asia/Jakarta')",
        { to: query.to },
      );
    const [items, total] = await qb
      .orderBy("order.orderDate", "DESC")
      .addOrderBy("order.orderId", "DESC")
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
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

  findById(orderId: string): Promise<Order | null> {
    return this.dataSource.getRepository(Order).findOne({
      where: { orderId },
      relations: { items: { product: true }, customer: true, history: true },
    });
  }

  private async createLowStockNotifications(
    manager: EntityManager,
    product: Product,
  ): Promise<void> {
    const adminUsers = await manager.getRepository(User).find({
      where: { deletedAt: IsNull(), role: { code: "admin" } },
      relations: { role: true },
    });
    for (const admin of adminUsers) {
      await manager
        .getRepository(Notification)
        .createQueryBuilder()
        .insert()
        .values({
          type: "LOW_STOCK_ALERT",
          dedupeKey: `low-stock:${product.productId}:${admin.userId}:${jakartaDatePart(new Date())}`,
          recipientUserId: admin.userId,
          recipientEmail: admin.email,
          payload: {
            productId: product.productId,
            productName: product.productName,
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold,
          },
        })
        .orIgnore()
        .execute();
    }
  }
}
