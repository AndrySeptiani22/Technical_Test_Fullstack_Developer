export type UUID = string;
export type ISODateString = string;
export type DecimalString = string;

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: { code: string; message: string };
  errors?: Record<string, string[]>;
}
