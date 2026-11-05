import { StatusCodes } from "http-status-codes";

export class BadRequestError extends Error {
  readonly httpStatus = StatusCodes.BAD_REQUEST;
  readonly code = "BAD_REQUEST";
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
