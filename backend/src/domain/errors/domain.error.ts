export class DomainRuleError extends Error {
  readonly isOperational = true;
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DomainConflictError extends DomainRuleError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
  }
}

export class DomainForbiddenError extends DomainRuleError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class DomainValidationError extends DomainRuleError {
  constructor(message: string) {
    super(message, 422, "VALIDATION_ERROR");
  }
}
