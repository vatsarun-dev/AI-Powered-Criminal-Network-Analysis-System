import type { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { ValidationError } from "../shared/error/globalError.js";

const validateRequest: RequestHandler = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((validationError) => ({
    field: validationError.type === "field" ? validationError.path : validationError.type,
    message: validationError.msg
  }));

  throw new ValidationError("Validation failed", errors);
};

export default validateRequest;
