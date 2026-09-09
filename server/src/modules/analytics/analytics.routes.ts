import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AnalyticsController from "./analytics.controller.js";

const routes = Router();
const analyticsController = new AnalyticsController();

// Aggregate investigative data is restricted to administrators. Gender and
// religion endpoints are descriptive-only and never return individual records.
routes.use(authMiddleware, authorizeRoles("admin"));

routes.get("/crime-categories", asyncHandler(analyticsController.crimeCategories.bind(analyticsController)));
routes.get("/districts", asyncHandler(analyticsController.districts.bind(analyticsController)));
routes.get("/demographics/gender", asyncHandler(analyticsController.gender.bind(analyticsController)));
routes.get("/demographics/religion", asyncHandler(analyticsController.religion.bind(analyticsController)));
routes.get("/graph/degree", asyncHandler(analyticsController.degree.bind(analyticsController)));
routes.get("/graph/betweenness", asyncHandler(analyticsController.betweenness.bind(analyticsController)));
routes.get("/graph/communities", asyncHandler(analyticsController.communities.bind(analyticsController)));
routes.get("/graph/shortest-path", asyncHandler(analyticsController.shortestPath.bind(analyticsController)));

export default routes;
