import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export default function validRequest(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const validationErrors = errors.array().map(({ path, msg }) => ({
    field: path,
    msg,
  }));

  return res.status(422).json({
    success: false,
    message: "Validation failed",
    errors: validationErrors,
  });
}
