import type { RequestHandler } from "express";

export default function asyncHandler(requestHandler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
}
