import { Router } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import RuleController from "./rule.controller.js";
import AlertController from "./alert.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import authorizeRoles from "../../middlewares/authorize.middleware.js";

const routes = Router();
const ruleController = new RuleController();
const alertController = new AlertController();

// Rules
routes.post(
  "/rule",
  authMiddleware,
  authorizeRoles("admin"),
  asyncHandler(ruleController.createRuleController.bind(ruleController)),
);

routes.get(
  "/rule",
  authMiddleware,
  asyncHandler(ruleController.listRulesController.bind(ruleController)),
);

routes.patch(
  "/rule/:ruleId",
  authMiddleware,
  authorizeRoles("admin"),
  asyncHandler(ruleController.toggleRuleController.bind(ruleController)),
);

// Alerts
routes.get(
  "/alert",
  authMiddleware,
  asyncHandler(alertController.listAlertsController.bind(alertController)),
);

routes.patch(
  "/alert/:alertId",
  authMiddleware,
  asyncHandler(alertController.updateAlertStatusController.bind(alertController)),
);

export default routes;