import { StatusCodes } from "http-status-codes";
import type { ErrorRequestHandler } from "express";
import ApiError from "../shared/error/ApiError.js";
import logger from "../config/logger.js";
import env from "../config/env.js";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err instanceof Error ? err.message : "Internal Server Error";
  const errors = err instanceof ApiError ? err.errors : undefined;

  if (statusCode >= 500) {
    logger.error({ err, path: req.path }, "Request failed");
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.NODE_ENV === "development" ? { stack: err instanceof Error ? err.stack : undefined } : {})
  });

  void next;
};

export default errorHandler;
