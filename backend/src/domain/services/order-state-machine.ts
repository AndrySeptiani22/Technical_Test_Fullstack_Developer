import {
  DomainConflictError,
  DomainForbiddenError,
  DomainValidationError,
} from "@domain/errors/domain.error";
import type { OrderStatus } from "@domain/entities/order-status.type";

export type ShopRole = "admin" | "cashier";
export type OrderAction = "pay" | "ship" | "complete" | "cancel";

const transitions: Record<
  OrderAction,
  { from: OrderStatus[]; to: OrderStatus; roles: ShopRole[] }
> = {
  pay: { from: ["PENDING"], to: "PAID", roles: ["admin", "cashier"] },
  ship: { from: ["PAID"], to: "SHIPPED", roles: ["admin"] },
  complete: { from: ["SHIPPED"], to: "COMPLETED", roles: ["admin"] },
  cancel: { from: ["PENDING", "PAID"], to: "CANCELLED", roles: ["admin"] },
};

export function resolveOrderTransition(
  current: OrderStatus,
  action: OrderAction,
  role: ShopRole,
  reason?: string,
): OrderStatus {
  const transition = transitions[action];
  if (!transition.roles.includes(role)) throw new DomainForbiddenError();
  if (!transition.from.includes(current)) {
    const verb = {
      pay: "paid",
      ship: "shipped",
      complete: "completed",
      cancel: "cancelled",
    }[action];
    throw new DomainConflictError(
      `Order cannot be ${verb} from status ${current}.`,
    );
  }
  if (action === "cancel" && !reason?.trim()) {
    throw new DomainValidationError("Cancellation reason is required.");
  }
  return transition.to;
}
