import { StatusCodes } from "http-status-codes";
import type { RequestHandler } from "express";
import AuthService, { type LoginUserRequest, type RegisterUserRequest } from "./auth.service.js";
import { appConstant } from "../../constant/appConstant.js";
import { successResponse } from "../../utils/ApiResponse.js";

export default class AuthController {
  private readonly authService = new AuthService();

  register: RequestHandler = async (req, res) => {
    const user = await this.authService.register(req.body as RegisterUserRequest, res);
    res.status(StatusCodes.CREATED).json(successResponse("User registered successfully", { user }));
  };

  login: RequestHandler = async (req, res) => {
    const user = await this.authService.login(req.body as LoginUserRequest, res);
    res.status(StatusCodes.OK).json(successResponse("User logged in successfully", { user }));
  };

  refresh: RequestHandler = async (req, res) => {
    const refreshToken = req.cookies[appConstant.cookies.refreshTokenName] as string | undefined;
    await this.authService.refresh(refreshToken, res);
    res.status(StatusCodes.OK).json(successResponse("Access token refreshed"));
  };

  logout: RequestHandler = async (req, res) => {
    await this.authService.logout(req.user, res);
    res.status(StatusCodes.OK).json(successResponse("User logged out successfully"));
  };

  me: RequestHandler = async (req, res) => {
    const user = await this.authService.getCurrentUser(req.user);
    res.status(StatusCodes.OK).json(successResponse("Current user found", { user }));
  };
}
