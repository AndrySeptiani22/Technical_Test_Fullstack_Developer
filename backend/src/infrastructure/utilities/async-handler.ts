import { Request, Response, NextFunction } from "express";
import { sendSuccess } from "@infrastructure/utilities/response-api";

export default function asyncHandler<T>(
  useCase: {
    handle: (request: T) => Promise<unknown>;
  },
  successMessage = "Success",
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await useCase.handle(req.body);

      return sendSuccess(res, successMessage, result);
    } catch (error) {
      next(error);
    }
  };
}
