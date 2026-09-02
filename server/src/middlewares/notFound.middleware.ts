import type { RequestHandler } from "express";
import { NotFoundError } from "../shared/error/globalError.js";

const notFoundHandler: RequestHandler = (req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFoundHandler;
