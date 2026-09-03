import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import AuthController from "./auth.controller.js";
import {
  loginValidationRule,
  registerValidationRule,
} from "./auth.validation.js";

const routes = Router();
const authController = new AuthController();

routes.post(
  "/register",
  registerValidationRule,
  asyncHandler(authController.registerController.bind(authController)),
);
routes.post(
  "/login",
  loginValidationRule,
  asyncHandler(authController.loginController.bind(authController)),
);

routes.post(
  "/refresh",
  asyncHandler(authController.refreshController.bind(authController)),
);

routes.get(
  "/me",
  authMiddleware,
  asyncHandler(authController.getMeController.bind(authController)),
);

export default routes;
