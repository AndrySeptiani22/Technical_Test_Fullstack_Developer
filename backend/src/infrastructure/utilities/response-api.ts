import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const sendSuccess = (
  res: Response,
  message: string,
  data: any,
  status = StatusCodes.OK,
) => {
  res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  error: Error | string,
  status?: number,
  details?: any,
) => {
  if (error instanceof Error) {
    const httpStatus =
      (error as any).httpStatus ?? status ?? StatusCodes.BAD_REQUEST;

    return res.status(httpStatus).json({
      success: false,
      message: error.message,
      ...("details" in error && (error as any).details
        ? { details: (error as any).details }
        : {}),
    });
  }

  return res.status(status ?? StatusCodes.BAD_REQUEST).json({
    success: false,
    message: error,
    ...(details ? { details } : {}),
  });
};
