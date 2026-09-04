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
  asyncHandler(authController.registerController),
);
routes.post(
  "/login",
  loginValidationRule,
  asyncHandler(authController.loginController),
);

routes.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default routes;
