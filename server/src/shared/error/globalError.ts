import { StatusCodes } from "http-status-codes";
import ApiError from "./ApiError.js";

export class BadRequestError extends ApiError {
  constructor(message = "Bad request", errors?: unknown) {
    super(StatusCodes.BAD_REQUEST, message, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(StatusCodes.FORBIDDEN, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource not found") {
    super(StatusCodes.NOT_FOUND, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Resource already exists") {
    super(StatusCodes.CONFLICT, message);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed", errors?: unknown) {
    super(StatusCodes.UNPROCESSABLE_ENTITY, message, errors);
  }
}
