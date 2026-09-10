import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { queryRag } from "./rag.controller.js";

const routes = Router();

routes.use(authMiddleware, authorizeRoles("admin"));
routes.post("/query", asyncHandler(queryRag));

export default routes;
