import type { DecimalString, ISODateString } from "./common.entity";

export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  stock: number;
  price: DecimalString;
  low_stock_threshold: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface StockMovement {
  id: string;
  product_id: string;
  type: "ORDER" | "ADJUSTMENT" | "CANCEL_RESTORE";
  quantity_change: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string;
  created_at: ISODateString;
}
