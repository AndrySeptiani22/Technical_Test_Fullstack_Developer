import { z } from "zod";
import { ValidationError } from "@application/models/error/application.error";

const positiveIntegerQuery = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number().int()])
  .pipe(z.number().int().min(1));

export const paginationQuerySchema = z
  .object({
    page: positiveIntegerQuery.default(1),
    limit: positiveIntegerQuery.optional(),
    pageSize: positiveIntegerQuery.optional(),
    search: z.string().max(200).optional(),
    sort_by: z.string().max(50).optional(),
    filters: z.string().max(8000).optional(),
    sort_order: z
      .string()
      .transform((value) => value.toUpperCase())
      .pipe(z.enum(["ASC", "DESC"]))
      .default("ASC"),
  })
  .strict();

export function parseRequest<TSchema extends z.ZodType>(
  schema: TSchema,
  value: unknown,
): z.infer<TSchema> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    const errors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join(".") || "body";
      (errors[key] ??= []).push(issue.message);
    }
    throw new ValidationError("Request validation failed.", errors);
  }
  return parsed.data;
}

export { z };
