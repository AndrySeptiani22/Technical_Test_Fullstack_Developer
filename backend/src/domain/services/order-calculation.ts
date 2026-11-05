export interface OrderLineInput {
  productId: string;
  quantity: number;
}

export interface CalculatedOrderLine extends OrderLineInput {
  unitPrice: string;
  subtotal: string;
}

function toCents(value: string | number): bigint {
  const normalized = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`Invalid monetary value: ${normalized}`);
  }
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
}

function fromCents(value: bigint): string {
  return `${value / 100n}.${String(value % 100n).padStart(2, "0")}`;
}

export function calculateOrderTotal<
  T extends { productId: string; quantity: number; price: string | number },
>(items: T[]): { lines: CalculatedOrderLine[]; totalAmount: string } {
  let total = 0n;
  const maxTotalCents = 99_999_999_999_999n;
  const lines = items.map((item) => {
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Order quantity must be a positive integer.");
    }
    const unitCents = toCents(item.price);
    const subtotalCents = unitCents * BigInt(item.quantity);
    total += subtotalCents;
    if (total > maxTotalCents)
      throw new Error("Order total exceeds numeric(14,2) precision.");
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: fromCents(unitCents),
      subtotal: fromCents(subtotalCents),
    };
  });
  return { lines, totalAmount: fromCents(total) };
}
