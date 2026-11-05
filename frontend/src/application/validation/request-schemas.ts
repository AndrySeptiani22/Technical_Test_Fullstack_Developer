import { z } from "zod";

const isISODate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
};

const isoDate = z.string().refine(isISODate, "Enter a valid date.");
const positiveInt32 = z.coerce
  .number()
  .int("Enter a whole number.")
  .min(1, "Must be at least 1.")
  .max(2_147_483_647, "Value is too large.");
const nonNegativeInt32 = z.coerce
  .number()
  .int("Enter a whole number.")
  .min(0, "Must be 0 or greater.")
  .max(2_147_483_647, "Value is too large.");
const productPrice = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Use a positive amount with up to 2 decimals.")
  .refine(
    (value) => Number(value) > 0 && Number(value) <= 9_999_999_999.99,
    "Price must be greater than 0 and no more than 9,999,999,999.99.",
  );

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .max(200, "Password must be at most 200 characters."),
});

export const productCreateFormSchema = z.object({
  product_code: z
    .string()
    .trim()
    .min(1, "Product code is required.")
    .max(50, "Product code must be at most 50 characters."),
  product_name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(200, "Product name must be at most 200 characters."),
  stock: nonNegativeInt32,
  price: productPrice,
  low_stock_threshold: nonNegativeInt32,
});

export const productUpdateFormSchema = z
  .object({
    product_code: z.string().trim().min(1).max(50).optional(),
    product_name: z.string().trim().min(1).max(200).optional(),
    price: productPrice.optional(),
    low_stock_threshold: nonNegativeInt32.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field must be provided.",
  });

export const stockAdjustmentFormSchema = z.object({
  quantity_change: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(-2_147_483_648, "Quantity change is too small.")
    .max(2_147_483_647, "Quantity change is too large.")
    .refine((value) => value !== 0, "Quantity change cannot be zero."),
  note: z
    .string()
    .trim()
    .min(1, "Note is required.")
    .max(1000, "Note must be at most 1000 characters."),
});

export const customerFormSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  customer_address: z
    .string()
    .trim()
    .min(1, "Address is required.")
    .max(500, "Address must be at most 500 characters."),
  gender: z.enum(["", "MALE", "FEMALE"]),
  birth_date: z.union([z.literal(""), isoDate]),
  phone: z.string().trim().max(30, "Phone must be at most 30 characters."),
  email: z.union([
    z.literal(""),
    z
      .string()
      .email("Enter a valid email address.")
      .max(255, "Email must be at most 255 characters."),
  ]),
});

export const orderCreateFormSchema = z
  .object({
    customer_id: z.string().uuid("Select a valid customer."),
    items: z
      .array(
        z.object({
          product_id: z
            .string()
            .regex(/^[1-9]\d{0,18}$/, "Select a valid product.")
            .refine(
              (value) => BigInt(value) <= 9_223_372_036_854_775_807n,
              "Select a valid product.",
            ),
          quantity: positiveInt32,
        }),
      )
      .min(1, "Add at least one item.")
      .max(100, "An order can contain at most 100 items."),
  })
  .superRefine(({ items }, context) => {
    const productIds = items.map((item) => item.product_id);
    if (new Set(productIds).size !== productIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["items"],
        message: "Each product can only be added once.",
      });
    }
  });

export type OrderCreateForm = z.infer<typeof orderCreateFormSchema>;

export const cancelOrderFormSchema = z.object({
  cancel_reason: z
    .string()
    .trim()
    .min(1, "A cancellation reason is required.")
    .max(500, "Reason must be at most 500 characters."),
});

export const reportDateRangeSchema = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .refine((range) => range.from <= range.to, {
    message: "From date must be on or before the To date.",
    path: ["from"],
  });
