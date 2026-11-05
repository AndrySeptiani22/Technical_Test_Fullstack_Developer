export interface ListQuery {
  page?: number;
  limit?: number | "all";
  search?: string;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  filters?: ListFilter[];
}

export interface ListFilter {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "greater_or_equal"
    | "less_than"
    | "less_or_equal"
    | "starts_with"
    | "ends_with"
    | "is_empty"
    | "is_not_empty"
    | "in";
  value?: string;
  values?: string[];
}
