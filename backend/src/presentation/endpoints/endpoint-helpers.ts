import { Request, Response, NextFunction } from "express";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import { UnauthorizedError } from "@application/models/error/unauthorized.error";
import type { BaseResponse } from "@application/models/response/base/base.response";
import {
  paginationQuerySchema,
  parseRequest,
} from "@application/models/validators/common.validator";
import type { PaginationRequest } from "@application/models/requests/common.request";
import { ValidationError } from "@application/models/error/application.error";
import {
  gridListRequestSchema,
  parseListFilters,
  type ListFilterKind,
} from "@application/models/validators/list-filter.validator";

export const asyncRoute =
  (
    handler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<unknown>,
  ) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const currentUserId = (required = true): string | null => {
  const userId = new HTTPContextAccessor().getUserId();
  if (required && !userId)
    throw new UnauthorizedError("Authenticated user is required");
  return userId;
};

export const sendModelResponse = <TResponse extends BaseResponse>(
  res: Response,
  result: TResponse,
) => res.status(result.httpStatus).json(result);

export function paginationFromRequest(
  req: Request,
  options: {
    allowedSortBy?: readonly string[];
    allowedFilters?: Readonly<Record<string, ListFilterKind>>;
    allowSearch?: boolean;
    allowSorting?: boolean;
  } = {},
) {
  const parsed: PaginationRequest = parseRequest(
    paginationQuerySchema,
    req.query,
  );
  if (parsed.sort_by && !options.allowedSortBy?.includes(parsed.sort_by)) {
    throw new ValidationError("Unsupported sort_by field.", {
      sort_by: ["Choose a supported sort field."],
    });
  }
  if (options.allowSorting === false && parsed.sort_order !== "ASC") {
    throw new ValidationError("Sorting is not supported for this endpoint.", {
      sort_order: ["Remove the unsupported sort_order parameter."],
    });
  }
  if (parsed.search && options.allowSearch === false) {
    throw new ValidationError("Search is not supported for this endpoint.", {
      search: ["Remove the unsupported search parameter."],
    });
  }
  const filters = parseListFilters(parsed.filters, options.allowedFilters ?? {});
  const rawLimit = parsed.limit ?? parsed.pageSize ?? 20;
  return {
    page: parsed.page,
    limit: Math.min(rawLimit, 100),
    search: parsed.search,
    sortBy: parsed.sort_by,
    sortOrder: parsed.sort_order,
    filters,
  };
}

export function gridListFromRequest(
  req: Request,
  options: {
    allowedSortBy?: readonly string[];
    allowedFilters?: Readonly<Record<string, ListFilterKind>>;
    allowedFilterValues?: Readonly<Record<string, readonly string[]>>;
    allowSearch?: boolean;
  } = {},
) {
  const parsed = parseRequest(gridListRequestSchema, req.body);
  if (parsed.sort_by && !options.allowedSortBy?.includes(parsed.sort_by)) {
    throw new ValidationError("Unsupported sort_by field.", {
      sort_by: ["Choose a supported sort field."],
    });
  }
  if (parsed.search && options.allowSearch === false) {
    throw new ValidationError("Search is not supported for this endpoint.", {
      search: ["Remove the unsupported search parameter."],
    });
  }
  const filters = parseListFilters(
    parsed.filters,
    options.allowedFilters ?? {},
    options.allowedFilterValues,
  );
  const all = parsed.limit === "all";
  const rawLimit =
    parsed.limit === "all"
      ? 100
      : (parsed.limit ?? parsed.pageSize ?? 10);
  return {
    page: parsed.page,
    limit: rawLimit,
    all,
    search: parsed.search,
    sortBy: parsed.sort_by,
    sortOrder: parsed.sort_order,
    filters,
  };
}
