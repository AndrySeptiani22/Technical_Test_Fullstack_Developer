import { z } from "./common.validator";

const dateRangeSchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
  })
  .strict()
  .refine((range) => range.from <= range.to, {
    message: "from must be earlier than or equal to to.",
    path: ["from"],
  });

const positiveIntegerQuery = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number().int()])
  .pipe(z.number().int().min(1));

export const salesReportQuerySchema = dateRangeSchema.extend({
  group_by: z.enum(["day", "month"]).default("day"),
});

export const topProductsReportQuerySchema = dateRangeSchema.extend({
  limit: positiveIntegerQuery.default(10),
});
