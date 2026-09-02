import { Router } from "express";
import HealthController from "./health.controller.js";

const routes = Router();
const healthController = new HealthController();

routes.get("/", healthController.status);

export default routes;
