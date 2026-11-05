import { z } from "./common.validator";

export const loginRequestSchema = z
  .object({
    email: z.email(),
    password: z.string().min(1).max(200),
  })
  .strict();

export const refreshRequestSchema = z
  .object({ refresh_token: z.string().min(32).max(500) })
  .strict();

export const logoutRequestSchema = refreshRequestSchema.partial();
