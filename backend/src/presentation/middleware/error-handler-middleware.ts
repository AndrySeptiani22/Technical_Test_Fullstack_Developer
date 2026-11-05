import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import appConfig from "@infrastructure/config/app-config";
import { sendErrorResponse } from "./error-response";

interface ApplicationError extends Error {
  httpStatus?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandlerMiddleware: ErrorRequestHandler = (
  error: ApplicationError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode = error.httpStatus ?? StatusCodes.INTERNAL_SERVER_ERROR;

  const isOperational =
    error.isOperational === true ||
    statusCode < StatusCodes.INTERNAL_SERVER_ERROR;

  console.error({
    name: error.name,
    code: error.code,
    message: error.message,
    stack: error.stack,
  });

  sendErrorResponse(req, res, statusCode, {
    success: false,

    error: {
      code:
        error.code ??
        (statusCode === StatusCodes.INTERNAL_SERVER_ERROR
          ? "INTERNAL_SERVER_ERROR"
          : error.name),

      message:
        isOperational || !appConfig.isProduction
          ? error.message
          : "An unexpected error occurred",
    },

    ...(appConfig.isProduction
      ? {}
      : {
          stack: error.stack,
        }),
  });
};
