import { StatusCodes } from "http-status-codes";

export class UnauthorizedError extends Error {
  readonly httpStatus = StatusCodes.UNAUTHORIZED;
  readonly code = "UNAUTHORIZED";
  readonly isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
