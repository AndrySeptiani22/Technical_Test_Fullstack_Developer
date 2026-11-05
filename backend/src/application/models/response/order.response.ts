import type { Order } from "@domain/entities/order.entity";
import {
  apiListSuccess,
  apiSuccess,
  type ApiSuccessResponse,
} from "./api.response";

export function serializeOrder(order: Order) {
  return {
    id: order.orderId,
    order_number: order.orderNumber,
    customer_id: order.customerId,
    customer: order.customer
      ? {
          id: order.customer.customerId,
          customer_name: order.customer.customerName,
          customer_address: order.customer.customerAddress,
          phone: order.customer.phone,
          email: order.customer.email,
        }
      : undefined,
    created_by: order.createdBy,
    status: order.status,
    total_amount: order.totalAmount,
    order_date: order.orderDate,
    paid_at: order.paidAt,
    shipped_at: order.shippedAt,
    completed_at: order.completedAt,
    cancelled_at: order.cancelledAt,
    cancel_reason: order.cancelReason,
    items: (order.items ?? []).map((item) => ({
      id: item.orderItemId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
    })),
    history: (order.history ?? []).map((item) => ({
      from_status: item.fromStatus,
      to_status: item.toStatus,
      reason: item.reason,
      created_by: item.createdBy,
      created_at: item.createdAt,
    })),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export type OrderResponseData = ReturnType<typeof serializeOrder>;
export type OrderResponse = ApiSuccessResponse<OrderResponseData>;

export const orderListResponse = (
  items: Order[],
  meta: Record<string, number>,
): ApiSuccessResponse<OrderResponseData[]> =>
  apiListSuccess(items.map(serializeOrder), meta);

export const orderResponse = (message: string, order: Order): OrderResponse =>
  apiSuccess(message, serializeOrder(order));

export const orderCreatedResponse = (order: Order): OrderResponse =>
  orderResponse("Order created.", order);

export interface InvoiceResponse {
  fileName: string;
  content: string;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export function invoiceResponse(order: Order): InvoiceResponse {
  const rows = (order.items ?? [])
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.product?.productName ?? item.productId)}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.subtotal}</td></tr>`,
    )
    .join("");
  return {
    fileName: `${order.orderNumber}.html`,
    content: `<!doctype html><html lang="en"><meta charset="utf-8"><title>${escapeHtml(order.orderNumber)}</title><h1>Invoice ${escapeHtml(order.orderNumber)}</h1><p>Status: ${order.status}</p><p>Total: ${order.totalAmount}</p><table><thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr></thead><tbody>${rows}</tbody></table>`,
  };
}
