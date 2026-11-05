import { StatusCodes } from "http-status-codes";

export class ApplicationError extends Error {
  readonly isOperational = true;

  constructor(
    message: string,
    readonly httpStatus: number = StatusCodes.BAD_REQUEST,
    readonly code: string = "BAD_REQUEST",
    readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, StatusCodes.CONFLICT, "CONFLICT", errors);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, StatusCodes.NOT_FOUND, "NOT_FOUND");
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, errors?: Record<string, string[]>) {
    super(
      message,
      StatusCodes.UNPROCESSABLE_ENTITY,
      "VALIDATION_ERROR",
      errors,
    );
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, StatusCodes.FORBIDDEN, "FORBIDDEN");
  }
}
