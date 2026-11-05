import { StatusCodes } from "http-status-codes";
import { BaseResponseWithData } from "./base.response";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export class PaginationResponse<T> extends BaseResponseWithData<
  PaginatedData<T>
> {
  constructor(
    message: string,
    items: T[],
    meta: PaginationMeta,
    httpStatus = StatusCodes.OK,
  ) {
    super(message, { items, meta }, httpStatus);
  }
}

export type PaginatedResponse<T> = PaginationResponse<T>;
