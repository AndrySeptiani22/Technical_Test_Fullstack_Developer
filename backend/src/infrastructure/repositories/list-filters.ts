import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import type { ListFilter } from "@application/abstract/repositories/icatalog.repository";

export type FilterFieldKind = "text" | "number" | "date";
export type FilterFieldMap = Readonly<
  Record<string, { expression: string; kind: FilterFieldKind }>
>;

const comparisonSql: Record<string, string> = {
  equals: "=",
  not_equals: "<>",
  greater_than: ">",
  greater_or_equal: ">=",
  less_than: "<",
  less_or_equal: "<=",
};

export function applyListFilters<Entity extends ObjectLiteral>(
  query: SelectQueryBuilder<Entity>,
  filters: ListFilter[] | undefined,
  fields: FilterFieldMap,
): void {
  for (const [index, filter] of (filters ?? []).entries()) {
    const field = fields[filter.field];
    if (!field) throw new Error(`Unsupported list filter field: ${filter.field}`);

    const parameter = `listFilter${index}`;
    const textExpression =
      field.kind === "text"
        ? `LOWER(COALESCE(CAST(${field.expression} AS text), ''))`
        : field.expression;
    if (filter.operator === "is_empty" || filter.operator === "is_not_empty") {
      const emptyComparison = `COALESCE(TRIM(CAST(${field.expression} AS text)), '') ${filter.operator === "is_empty" ? "=" : "<>"} ''`;
      query.andWhere(emptyComparison);
      continue;
    }

    const value = filter.value!;
    if (filter.operator === "contains" || filter.operator === "not_contains") {
      const expression = `POSITION(LOWER(:${parameter}) IN ${textExpression})`;
      query.andWhere(
        `${expression} ${filter.operator === "contains" ? ">" : "="} 0`,
        { [parameter]: value },
      );
      continue;
    }
    if (filter.operator === "starts_with" || filter.operator === "ends_with") {
      const functionName = filter.operator === "starts_with" ? "LEFT" : "RIGHT";
      query.andWhere(
        `${functionName}(${textExpression}, LENGTH(:${parameter})) = LOWER(:${parameter})`,
        { [parameter]: value },
      );
      continue;
    }
    if (filter.operator === "in") {
      query.andWhere(`${textExpression} IN (:...${parameter})`, {
        [parameter]: filter.values!.map((value) => value.toLocaleLowerCase()),
      });
      continue;
    }

    const operator = comparisonSql[filter.operator];
    if (!operator)
      throw new Error(`Unsupported list filter operator: ${filter.operator}`);
    const cast = field.kind === "number" ? "numeric" : field.kind === "date" ? "date" : "text";
    const comparisonValue =
      field.kind === "text"
        ? `LOWER(CAST(:${parameter} AS text))`
        : `CAST(:${parameter} AS ${cast})`;
    query.andWhere(
      `${textExpression} ${operator} ${comparisonValue}`,
      { [parameter]: value },
    );
  }
}
