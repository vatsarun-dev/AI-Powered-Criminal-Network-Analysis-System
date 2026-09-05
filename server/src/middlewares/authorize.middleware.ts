import type { RequestHandler } from "express";
import type { Role } from "../types/auth.js";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../shared/error/globalError.js";

/**
 * Use after authMiddleware to limit a route to one or more existing roles.
 * Example: routes.post("/reports", authMiddleware, authorizeRoles("admin"), handler)
 */
const authorizeRoles = (...allowedRoles: Role[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication is required"));
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError("You do not have permission to access this resource"));
      return;
    }

    next();
  };
};

export default authorizeRoles;
