import type { z } from "zod";
import type {
  loginRequestSchema,
  logoutRequestSchema,
  refreshRequestSchema,
} from "@application/models/validators/auth.validator";

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
export type LogoutRequest = z.infer<typeof logoutRequestSchema>;
