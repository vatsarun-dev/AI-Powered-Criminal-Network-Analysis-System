import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";
import AuthService from "./auth.service.js";
import {
  type LoginUserRequest,
  type RegisterUserRequest,
} from "../../types/Response.js";
import { appConstant } from "../../constant/appConstant.js";
import { ApiResponseBody, successResponse } from "../../utils/ApiResponse.js";

export default class AuthController {
  private readonly authService = new AuthService();

  async registerController(req: Request, res: Response): Promise<void> {
    const user = await this.authService.register(
      req.body as RegisterUserRequest,
      res,
    );
    res
      .status(StatusCodes.CREATED)
      .json(successResponse("User registered successfully", { user }));
  }

  async loginController(req: Request, res: Response): Promise<void> {
    const user = await this.authService.login(
      req.body as LoginUserRequest,
      res,
    );
    res
      .status(StatusCodes.OK)
      .json(successResponse("User logged in successfully", { user }));
  }

  async refreshController(req: Request, res: Response): Promise<void> {
    const user = await this.authService.refreshService(req, res);

    res
      .status(StatusCodes.OK)
      .json(successResponse("access token set successfully", { user }));
  }

  async logoutController(req: Request, res: Response): Promise<void> {
    await this.authService.logoutService(req, res);
    res.status(StatusCodes.OK).json(successResponse("Logged out successfully"));
  }

  async getMeController(req: Request, res: Response): Promise<void> {
    const user = await this.authService.getMeService(req as Request,res as Response);
    res
      .status(StatusCodes.OK)
      .json(successResponse("user find successfully", { user }));
  }
}
