import { StatusCodes } from "http-status-codes";
import type { RequestHandler } from "express";
import AuthService from "./auth.service.ts";
import {
  type LoginUserRequest,
  type RegisterUserRequest,
} from "../../types/Response.ts";
import { appConstant } from "../../constant/appConstant.js";
import { successResponse } from "../../utils/ApiResponse.js";

export default class AuthController {
  private readonly authService = new AuthService();

  async registerController(req, res): RequestHandler {
    const user = await this.authService.register(
      req.body as RegisterUserRequest,
      res,
    );
    res
      .status(StatusCodes.CREATED)
      .json(successResponse("User registered successfully", { user }));
  }

  async loginController(req, res): RequestHandler {
    const user = await this.authService.login(
      req.body as LoginUserRequest,
      res,
    );
    res
      .status(StatusCodes.OK)
      .json(successResponse("User logged in successfully", { user }));
  }
}
