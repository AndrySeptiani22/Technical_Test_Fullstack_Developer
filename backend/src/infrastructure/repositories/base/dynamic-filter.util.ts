import { BadRequestError } from "@application/models/error/bad-request.error";
import {
  PaginationQuery,
  SearchFilter,
} from "@application/models/pagination/pagination.query";
import { EntityMetadata, ObjectLiteral, SelectQueryBuilder } from "typeorm";

type ColumnMetadata = EntityMetadata["columns"][number];

function getMainAlias<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
) {
  const alias = qb.expressionMap.mainAlias;

  if (!alias?.metadata) {
    throw new BadRequestError(
      "Dynamic filtering requires a query builder with an entity metadata definition.",
    );
  }

  return alias;
}

function getColumn<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
  field: string,
): ColumnMetadata {
  const alias = getMainAlias(qb);
  const metadata = alias.metadata;

  const column =
    metadata.findColumnWithPropertyPath(field) ??
    metadata.findColumnWithPropertyName(field);

  if (!column) {
    throw new BadRequestError(
      `Filtering by field '${field}' is not allowed because it does not exist on entity '${metadata.name}'.`,
    );
  }

  return column;
}

function getColumnExpression<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
  column: ColumnMetadata,
): string {
  const alias = getMainAlias(qb).name;
  return `${alias}.${column.propertyPath}`;
}

function getTypeName(column: ColumnMetadata): string {
  if (typeof column.type === "string") {
    return column.type.toLowerCase();
  }

  if (column.type === String) return "string";
  if (column.type === Number) return "number";
  if (column.type === Boolean) return "boolean";
  if (column.type === Date) return "date";

  return "unknown";
}

function isStringColumn(column: ColumnMetadata): boolean {
  return new Set([
    "string",
    "varchar",
    "character varying",
    "char",
    "character",
    "text",
    "citext",
    "uuid",
    "enum",
    "simple-enum",
  ]).has(getTypeName(column));
}

function isBooleanColumn(column: ColumnMetadata): boolean {
  return ["boolean", "bool"].includes(getTypeName(column));
}

function isNumberColumn(column: ColumnMetadata): boolean {
  return new Set([
    "number",
    "smallint",
    "int2",
    "integer",
    "int",
    "int4",
    "bigint",
    "int8",
    "decimal",
    "numeric",
    "real",
    "float",
    "double precision",
    "float4",
    "float8",
    "money",
  ]).has(getTypeName(column));
}

function isDateColumn(column: ColumnMetadata): boolean {
  return new Set([
    "date",
    "time",
    "time without time zone",
    "time with time zone",
    "timetz",
    "timestamp",
    "timestamp without time zone",
    "timestamp with time zone",
    "timestamptz",
    "datetime",
  ]).has(getTypeName(column));
}

function getSearchableColumns<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
): ColumnMetadata[] {
  return getMainAlias(qb).metadata.columns.filter(
    (column) => column.isSelect !== false,
  );
}

function escapeLikeValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value === "boolean") return value;

  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;

  throw new BadRequestError(
    `Invalid boolean value for filter field '${field}'.`,
  );
}

function normalizeNumber(
  value: unknown,
  field: string,
  column: ColumnMetadata,
): number | string {
  if (getTypeName(column) === "bigint") {
    if (typeof value === "number" && !Number.isSafeInteger(value)) {
      throw new BadRequestError(
        `Invalid bigint value for filter field '${field}'.`,
      );
    }

    const stringValue = String(value);
    if (!/^-?\d+$/.test(stringValue)) {
      throw new BadRequestError(
        `Invalid bigint value for filter field '${field}'.`,
      );
    }

    return stringValue;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new BadRequestError(
      `Invalid number value for filter field '${field}'.`,
    );
  }

  return numberValue;
}

function normalizeValue(
  value: unknown,
  field: string,
  column: ColumnMetadata,
): unknown {
  if (isBooleanColumn(column)) {
    return normalizeBoolean(value, field);
  }

  if (isNumberColumn(column)) {
    return normalizeNumber(value, field, column);
  }

  if (isDateColumn(column)) {
    if (value instanceof Date) return value;
    const dateValue = String(value);
    if (!dateValue.trim()) {
      throw new BadRequestError(
        `Invalid date value for filter field '${field}'.`,
      );
    }
    return dateValue;
  }

  return value;
}

function normalizeValues(
  value: unknown,
  field: string,
  column: ColumnMetadata,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new BadRequestError(`Filter value for '${field}' must be an array.`);
  }

  return value.map((item) => normalizeValue(item, field, column));
}

function assertValuePresent(filter: SearchFilter): void {
  if (filter.value === undefined || filter.value === null) {
    throw new BadRequestError(
      `Filter '${filter.field}' with operator '${filter.operator}' requires a value.`,
    );
  }
}

function assertStringOperator(
  filter: SearchFilter,
  column: ColumnMetadata,
): void {
  if (!isStringColumn(column)) {
    throw new BadRequestError(
      `Operator '${filter.operator}' is only valid for string field '${filter.field}'.`,
    );
  }
}

function buildCondition(
  filter: SearchFilter,
  column: ColumnMetadata,
  expression: string,
  parameterName: string,
): { sql: string; parameters?: Record<string, unknown> } {
  const { field, operator } = filter;

  switch (operator) {
    case "isNull":
      return { sql: `${expression} IS NULL` };

    case "isNotNull":
      return { sql: `${expression} IS NOT NULL` };

    case "contains": {
      assertValuePresent(filter);
      assertStringOperator(filter, column);
      const value = escapeLikeValue(String(filter.value));
      return {
        sql: `${expression} ILIKE :${parameterName} ESCAPE '\\'`,
        parameters: { [parameterName]: `%${value}%` },
      };
    }

    case "notContains": {
      assertValuePresent(filter);
      assertStringOperator(filter, column);
      const value = escapeLikeValue(String(filter.value));
      return {
        sql: `${expression} NOT ILIKE :${parameterName} ESCAPE '\\'`,
        parameters: { [parameterName]: `%${value}%` },
      };
    }

    case "startsWith": {
      assertValuePresent(filter);
      assertStringOperator(filter, column);
      const value = escapeLikeValue(String(filter.value));
      return {
        sql: `${expression} ILIKE :${parameterName} ESCAPE '\\'`,
        parameters: { [parameterName]: `${value}%` },
      };
    }

    case "endsWith": {
      assertValuePresent(filter);
      assertStringOperator(filter, column);
      const value = escapeLikeValue(String(filter.value));
      return {
        sql: `${expression} ILIKE :${parameterName} ESCAPE '\\'`,
        parameters: { [parameterName]: `%${value}` },
      };
    }

    case "like": {
      assertValuePresent(filter);
      assertStringOperator(filter, column);
      return {
        sql: `${expression} ILIKE :${parameterName}`,
        parameters: { [parameterName]: String(filter.value) },
      };
    }

    case "notLike": {
      assertValuePresent(filter);
      assertStringOperator(filter, column);
      return {
        sql: `${expression} NOT ILIKE :${parameterName}`,
        parameters: { [parameterName]: String(filter.value) },
      };
    }

    case "equal": {
      if (filter.value === null) {
        return { sql: `${expression} IS NULL` };
      }
      assertValuePresent(filter);
      return {
        sql: `${expression} = :${parameterName}`,
        parameters: {
          [parameterName]: normalizeValue(filter.value, field, column),
        },
      };
    }

    case "notEqual": {
      if (filter.value === null) {
        return { sql: `${expression} IS NOT NULL` };
      }
      assertValuePresent(filter);
      return {
        sql: `${expression} <> :${parameterName}`,
        parameters: {
          [parameterName]: normalizeValue(filter.value, field, column),
        },
      };
    }

    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      assertValuePresent(filter);
      const operatorMap: Record<string, string> = {
        gt: ">",
        gte: ">=",
        lt: "<",
        lte: "<=",
      };

      return {
        sql: `${expression} ${operatorMap[operator]} :${parameterName}`,
        parameters: {
          [parameterName]: normalizeValue(filter.value, field, column),
        },
      };
    }

    case "in":
    case "notIn": {
      const values = normalizeValues(filter.value, field, column);
      if (values.length === 0) {
        throw new BadRequestError(
          `Filter '${field}' requires at least one value.`,
        );
      }

      return {
        sql: `${expression} ${operator === "in" ? "IN" : "NOT IN"} (:...${parameterName})`,
        parameters: { [parameterName]: values },
      };
    }

    default:
      throw new BadRequestError(`Unsupported filter operator '${operator}'.`);
  }
}

export function applyDynamicFilters<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
  query: PaginationQuery,
): void {
  const searchableColumns = getSearchableColumns(qb);

  if (query.search?.trim() && searchableColumns.length > 0) {
    const parameterName = "__globalSearch";
    const value = `%${escapeLikeValue(query.search.trim())}%`;
    const searchClauses = searchableColumns.map(
      (column) =>
        `CAST(${getColumnExpression(qb, column)} AS TEXT) ILIKE :${parameterName} ESCAPE '\\'`,
    );

    qb.andWhere(`(${searchClauses.join(" OR ")})`, {
      [parameterName]: value,
    });
  }

  for (const [index, filter] of (query.filters ?? []).entries()) {
    const column = getColumn(qb, filter.field);
    const expression = getColumnExpression(qb, column);
    const parameterName = `__filter_${index}`;
    const condition = buildCondition(filter, column, expression, parameterName);

    qb.andWhere(condition.sql, condition.parameters);
  }
}

export function applyDynamicOrder<TEntity extends ObjectLiteral>(
  qb: SelectQueryBuilder<TEntity>,
  query: PaginationQuery,
): void {
  const alias = getMainAlias(qb);
  const metadata = alias.metadata;

  const requested = query.sortBy?.trim();
  const column = requested
    ? (metadata.findColumnWithPropertyPath(requested) ??
      metadata.findColumnWithPropertyName(requested))
    : (metadata.primaryColumns[0] ?? metadata.columns[0]);

  if (!column) {
    throw new BadRequestError(
      `Entity '${metadata.name}' has no columns available for sorting.`,
    );
  }

  if (column.isSelect === false) {
    throw new BadRequestError(
      `Sorting by field '${requested}' is not allowed because the entity column is not selectable.`,
    );
  }

  qb.orderBy(
    getColumnExpression(qb, column),
    query.sortOrder === "DESC" ? "DESC" : "ASC",
  );
}
