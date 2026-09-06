import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import CaseController from "./case.controller.js";

const routes = Router();
const caseController = new CaseController();

routes.use(authMiddleware, authorizeRoles("admin"));

routes.post("/", asyncHandler(caseController.create.bind(caseController)));
routes.get("/", asyncHandler(caseController.list.bind(caseController)));
routes.get("/:id", asyncHandler(caseController.getById.bind(caseController)));
routes.patch("/:id", asyncHandler(caseController.update.bind(caseController)));

export default routes;
