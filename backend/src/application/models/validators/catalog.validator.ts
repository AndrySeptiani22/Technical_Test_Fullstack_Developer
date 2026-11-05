import { z } from "./common.validator";

export const productIdParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d{0,18}$/)
    .refine((value) => BigInt(value) <= 9_223_372_036_854_775_807n),
});

export const productCreateRequestSchema = z
  .object({
    product_code: z.string().trim().min(1).max(50),
    product_name: z.string().trim().min(1).max(200),
    stock: z.number().int().min(0).max(2_147_483_647).default(0),
    price: z
      .union([z.string(), z.number()])
      .transform(String)
      .refine(
        (value) =>
          /^\d+(\.\d{1,2})?$/.test(value) &&
          Number(value) > 0 &&
          Number(value) <= 9_999_999_999.99,
      ),
    low_stock_threshold: z.number().int().min(0).max(2_147_483_647).default(5),
  })
  .strict();

export const productUpdateRequestSchema = productCreateRequestSchema
  .partial()
  .omit({ stock: true })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field must be provided.",
  });

export const stockAdjustmentRequestSchema = z
  .object({
    quantity_change: z
      .number()
      .int()
      .min(-2_147_483_647)
      .max(2_147_483_647)
      .refine((value) => value !== 0),
    note: z.string().trim().min(1).max(1000),
  })
  .strict();

export const customerIdParamsSchema = z.object({ id: z.uuid() });

const customerFields = {
  customer_name: z.string().trim().min(1).max(200),
  customer_address: z.string().trim().min(1).max(500),
  gender: z.enum(["MALE", "FEMALE"]).nullable().optional(),
  birth_date: z.iso.date().nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.email().max(255).nullable().optional(),
};

export const customerCreateRequestSchema = z.object(customerFields).strict();

export const customerUpdateRequestSchema = customerCreateRequestSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one customer field must be provided.",
  });
