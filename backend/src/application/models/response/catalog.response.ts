import type { Customer, Product, StockMovement } from "@domain/entities";
import {
  apiListSuccess,
  apiSuccess,
  type ApiSuccessResponse,
} from "./api.response";

export interface ProductResponse {
  id: string;
  product_code: string;
  product_name: string;
  stock: number;
  price: string;
  low_stock_threshold: number;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerResponse {
  id: string;
  customer_name: string;
  customer_address: string;
  gender: Customer["gender"];
  birth_date: Customer["birthDate"];
  phone: Customer["phone"];
  email: Customer["email"];
  created_at: Date;
  updated_at: Date;
}

export interface StockMovementResponse {
  id: string;
  product_id: string;
  type: StockMovement["type"];
  quantity_change: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: Date;
}

export const serializeProduct = (product: Product): ProductResponse => ({
  id: product.productId,
  product_code: product.productCode,
  product_name: product.productName,
  stock: product.stock,
  price: product.price,
  low_stock_threshold: product.lowStockThreshold,
  created_at: product.createdAt,
  updated_at: product.updatedAt,
});

export const serializeCustomer = (customer: Customer): CustomerResponse => ({
  id: customer.customerId,
  customer_name: customer.customerName,
  customer_address: customer.customerAddress,
  gender: customer.gender,
  birth_date: customer.birthDate,
  phone: customer.phone,
  email: customer.email,
  created_at: customer.createdAt,
  updated_at: customer.updatedAt,
});

export const serializeStockMovement = (
  item: StockMovement,
): StockMovementResponse => ({
  id: item.stockMovementId,
  product_id: item.productId,
  type: item.type,
  quantity_change: item.quantityChange,
  stock_after: item.stockAfter,
  reference_type: item.referenceType,
  reference_id: item.referenceId,
  note: item.note,
  created_by: item.createdBy,
  created_at: item.createdAt,
});

export const productListResponse = (
  items: Product[],
  meta: Record<string, number>,
): ApiSuccessResponse<ProductResponse[]> =>
  apiListSuccess(items.map(serializeProduct), meta);

export const productResponse = (
  message: string,
  product: Product,
): ApiSuccessResponse<ProductResponse> =>
  apiSuccess(message, serializeProduct(product));

export const customerListResponse = (
  items: Customer[],
  meta: Record<string, number>,
): ApiSuccessResponse<CustomerResponse[]> =>
  apiListSuccess(items.map(serializeCustomer), meta);

export const customerResponse = (
  message: string,
  customer: Customer,
): ApiSuccessResponse<CustomerResponse> =>
  apiSuccess(message, serializeCustomer(customer));

export const stockMovementListResponse = (
  items: StockMovement[],
  meta: Record<string, number>,
): ApiSuccessResponse<StockMovementResponse[]> =>
  apiListSuccess(items.map(serializeStockMovement), meta);
