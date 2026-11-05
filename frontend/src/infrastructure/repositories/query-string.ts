export function queryString(params: object): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "")
      searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function listQueryParams<T extends { filters?: unknown[] }>(query: T) {
  return {
    ...query,
    filters: query.filters?.length ? JSON.stringify(query.filters) : undefined,
  };
}
