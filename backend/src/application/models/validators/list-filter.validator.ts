import { z } from "./common.validator";
import { ValidationError } from "@application/models/error/application.error";
import type { ListFilter } from "@application/abstract/repositories/icatalog.repository";

const operators = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "greater_than",
  "greater_or_equal",
  "less_than",
  "less_or_equal",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "in",
] as const;

const filtersSchema = z
  .array(
    z
      .object({
        field: z.string().min(1).max(50),
        operator: z.enum(operators),
        value: z.string().max(200).optional(),
        values: z.array(z.string().min(1).max(50)).min(1).max(5).optional(),
      })
      .strict(),
  )
  .max(20);

export const gridListRequestSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    limit: z
      .union([
        z.number().int().min(1).max(100),
        z.literal("all"),
      ])
      .optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    search: z.string().max(200).optional(),
    sort_by: z.string().max(50).optional(),
    sort_order: z
      .string()
      .transform((value) => value.toUpperCase())
      .pipe(z.enum(["ASC", "DESC"]))
      .default("ASC"),
    filters: filtersSchema.optional(),
  })
  .strict();

export type ListFilterKind = "text" | "number" | "date";

const comparisonOperators = new Set([
  "equals",
  "not_equals",
  "greater_than",
  "greater_or_equal",
  "less_than",
  "less_or_equal",
]);
const textOperators = new Set([
  ...comparisonOperators,
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "in",
]);

export function parseListFilters(
  raw: unknown,
  allowedFields: Readonly<Record<string, ListFilterKind>>,
  allowedValues: Readonly<Record<string, readonly string[]>> = {},
): ListFilter[] {
  if (raw === undefined || raw === null || raw === "") return [];

  let decoded: unknown;
  if (typeof raw === "string") {
    try {
      decoded = JSON.parse(raw);
    } catch {
      throw new ValidationError("Invalid filters JSON.", {
        filters: ["Provide filters as a JSON array."],
      });
    }
  } else {
    decoded = raw;
  }

  const parsed = filtersSchema.safeParse(decoded);
  if (!parsed.success) {
    throw new ValidationError("Invalid list filters.", {
      filters: parsed.error.issues.map((issue) => issue.message),
    });
  }

  return parsed.data.map((filter, index) => {
    const kind = allowedFields[filter.field];
    if (!kind) {
      throw new ValidationError("Unsupported filter field.", {
        [`filters.${index}.field`]: ["Choose a supported field."],
      });
    }

    const unary = filter.operator === "is_empty" || filter.operator === "is_not_empty";
    if (filter.operator === "in") {
      if (
        kind !== "text" ||
        filter.value !== undefined ||
        !filter.values?.length ||
        new Set(filter.values).size !== filter.values.length
      ) {
        throw new ValidationError("Unsupported filter values.", {
          [`filters.${index}.values`]: ["Provide unique values for a text field."],
        });
      }
      const permittedValues = allowedValues[filter.field];
      if (
        permittedValues &&
        filter.values.some((value) => !permittedValues.includes(value))
      ) {
        throw new ValidationError("Unsupported filter value.", {
          [`filters.${index}.values`]: ["Choose supported values."],
        });
      }
      return filter;
    }
    if (filter.values !== undefined) {
      throw new ValidationError("Unsupported filter values.", {
        [`filters.${index}.values`]: ["Values are only supported by the in operator."],
      });
    }
    const allowedOperators = kind === "text" ? textOperators : comparisonOperators;
    if (unary ? filter.value !== undefined : !allowedOperators.has(filter.operator)) {
      throw new ValidationError("Unsupported filter operator.", {
        [`filters.${index}.operator`]: ["Choose an operator supported by this field."],
      });
    }
    if (!unary && (filter.value === undefined || filter.value.trim() === "")) {
      throw new ValidationError("Filter value is required.", {
        [`filters.${index}.value`]: ["Provide a value for this filter."],
      });
    }
    if (kind === "number" && filter.value !== undefined && !Number.isFinite(Number(filter.value))) {
      throw new ValidationError("Numeric filter value is invalid.", {
        [`filters.${index}.value`]: ["Provide a valid number."],
      });
    }
    if (
      kind === "date" &&
      filter.value !== undefined &&
      !z.iso.date().safeParse(filter.value).success
    ) {
      throw new ValidationError("Date filter value is invalid.", {
        [`filters.${index}.value`]: ["Provide a date in YYYY-MM-DD format."],
      });
    }
    return filter;
  });
}
