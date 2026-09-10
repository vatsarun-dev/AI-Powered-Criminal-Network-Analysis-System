import { Router } from "express";

import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import CrimeMapController from "./map.controller.js";

const routes = Router();
const mapController = new CrimeMapController();

routes.use(authMiddleware, authorizeRoles("admin"));
routes.get("/overview", asyncHandler(mapController.overview.bind(mapController)));
routes.get("/districts/:id", asyncHandler(mapController.districtDetails.bind(mapController)));
routes.get("/police-stations/:id", asyncHandler(mapController.policeStationDetails.bind(mapController)));

export default routes;
