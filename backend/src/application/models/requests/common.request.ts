import type { z } from "zod";
import type { paginationQuerySchema } from "@application/models/validators/common.validator";

export type PaginationRequest = z.infer<typeof paginationQuerySchema>;
