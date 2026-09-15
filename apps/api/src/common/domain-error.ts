import type { ErrorCode } from "@sales/shared";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const unauthorized = (message = "Authentication required") =>
  new DomainError("UNAUTHORIZED", message, 401);

export const notFound = (message: string) => new DomainError("NOT_FOUND", message, 404);

export const conflict = (message: string) => new DomainError("CONFLICT", message, 409);

export const validationError = (message: string, details: unknown = null) =>
  new DomainError("VALIDATION_ERROR", message, 400, details);
