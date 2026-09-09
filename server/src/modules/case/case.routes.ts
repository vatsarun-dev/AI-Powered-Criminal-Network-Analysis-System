import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import CaseController from "./case.controller.js";
import FirController from "./fir.controller.js";

const routes = Router();
const caseController = new CaseController();
const firController = new FirController();

routes.use(authMiddleware, authorizeRoles("admin"));

// MongoDB is the detailed FIR source of truth. The existing Neo4j CASE API
// below is retained for compatibility with earlier graph clients.
routes.post("/firs", asyncHandler(firController.create.bind(firController)));
routes.get("/firs", asyncHandler(firController.list.bind(firController)));
routes.get("/firs/:id/evidence", asyncHandler(firController.evidence.bind(firController)));
routes.get("/firs/:id/network", asyncHandler(firController.network.bind(firController)));
routes.get("/firs/:id", asyncHandler(firController.getById.bind(firController)));
routes.patch("/firs/:id", asyncHandler(firController.update.bind(firController)));
routes.delete("/firs/:id", asyncHandler(firController.delete.bind(firController)));

routes.post("/", asyncHandler(caseController.create.bind(caseController)));
routes.get("/", asyncHandler(caseController.list.bind(caseController)));
routes.get("/:id", asyncHandler(caseController.getById.bind(caseController)));
routes.patch("/:id", asyncHandler(caseController.update.bind(caseController)));

export default routes;
