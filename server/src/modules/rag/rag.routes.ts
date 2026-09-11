import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import RagController from "./rag.controller.js";

const routes = Router();
const controller = new RagController();
routes.post("/ask", authMiddleware, authorizeRoles("admin"), asyncHandler(controller.ask.bind(controller)));
export default routes;
