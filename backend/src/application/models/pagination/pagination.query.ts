export type SearchFilterOperator =
  | "isNull"
  | "isNotNull"
  | "contains"
  | "notContains"
  | "startsWith"
  | "endsWith"
  | "like"
  | "notLike"
  | "equal"
  | "notEqual"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn";

export interface SearchFilter {
  field: string;
  operator: SearchFilterOperator;
  value?: unknown;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: SearchFilter[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface PaginatedResult<TEntity> {
  items: TEntity[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export function normalizePagination(query: PaginationQuery): {
  page: number;
  pageSize: number;
} {
  const page =
    Number.isInteger(query.page) && (query.page ?? 0) > 0 ? query.page! : 1;
  const pageSize =
    Number.isInteger(query.pageSize) && (query.pageSize ?? 0) > 0
      ? Math.min(query.pageSize!, 100)
      : 20;
  return { page, pageSize };
}
