import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { sendErrorResponse } from "./error-response";

export const notFoundMiddleware = (req: Request, res: Response): void => {
  sendErrorResponse(req, res, StatusCodes.NOT_FOUND, {
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    },
  });
};
