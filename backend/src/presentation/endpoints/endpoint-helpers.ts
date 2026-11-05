import { Request, Response, NextFunction } from "express";
import { HTTPContextAccessor } from "@infrastructure/config/http-context-accessor";
import { UnauthorizedError } from "@application/models/error/unauthorized.error";
import type { BaseResponse } from "@application/models/response/base/base.response";

export const asyncRoute =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };

export const currentUserId = (required = true): string | null => {
  const userId = new HTTPContextAccessor().getUserId();
  if (required && !userId) {
    throw new UnauthorizedError("Authenticated user is required");
  }
  return userId;
};

export const sendModelResponse = <TResponse extends BaseResponse>(
  res: Response,
  result: TResponse,
) => {
  return res.status(result.httpStatus).json(result);
};
