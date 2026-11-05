import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export type RepoEnvelope = {
  isError: boolean;
  message: string;
  httpStatus?: number;
};

export const mapStatus = (result: RepoEnvelope): number => {
  if (typeof result.httpStatus === "number") {
    return result.httpStatus;
  }

  return result.isError ? StatusCodes.BAD_REQUEST : StatusCodes.OK;
};

export const bindEndpointHandler = <TRequest, TResponse extends RepoEnvelope>(
  handler: (request: TRequest) => Promise<TResponse>,
  mapRequest?: (req: Request) => TRequest,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = mapRequest ? mapRequest(req) : (req.body as TRequest);
      const result = await handler(request);
      return res.status(mapStatus(result)).json(result);
    } catch (error) {
      return next(error);
    }
  };
};
