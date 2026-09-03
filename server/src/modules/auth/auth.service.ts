import type { Response } from "express";
import UserRepo from "../../repository/user.repo.js";
// import { appConstant } from "../../constant/appConstant.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/error/globalError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.ts";
import type { AuthUser } from "../../types/auth.ts";
import type {
  RegisterUserRequest,
  LoginUserRequest,
  AuthResponseUser,
} from "../../types/Response.ts";
import { appConstant } from "../../constant/appConstant.ts";
/**
 * @vatsarun-dev
 * THIS IS THE SERVICE FILE
 */

export default class AuthService {
  private readonly userRepo = new UserRepo();

  /** TO GET RESPONSE IN STRUCTURED WAY */
  private toResponseUser(user: AuthUser): AuthResponseUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? "",
    };
  }

  /**  TO SET THE TOKEN IN BROWSER */
  private async issueAuthCookies(
    user: AuthResponseUser,
    res: Response,
  ): Promise<void> {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await this.userRepo.saveRefreshToken(user.id, refreshToken);

    res.cookie(
      "accessToken",
      accessToken,
      appConstant.cookies.accessTokenOptions,
    );
    res.cookie(
      "refreshToken",
      refreshToken,
      appConstant.cookies.refreshTokenOptions,
    );
  }

  /** REGISTER USER LOGIC   */
  async register(
    input: RegisterUserRequest,
    res: Response,
  ): Promise<AuthResponseUser> {
    if (!input.name || !input.email || !input.password)
      throw new NotFoundError("fill all these fields");

    const existingUser = await this.userRepo.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const user = await this.userRepo.createUser(input);
    const responseUser = this.toResponseUser(user);

    await this.issueAuthCookies(responseUser, res);

    return responseUser;
  }

  async login(
    input: LoginUserRequest,
    res: Response,
  ): Promise<AuthResponseUser> {
    if (!input.email || !input.password)
      throw new NotFoundError("fill all these fields");
    const user = await this.userRepo.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatches = await user.comparePassword(input.password);

    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const responseUser = this.toResponseUser(user);
    await this.issueAuthCookies(responseUser, res);

    return responseUser;
  }
}
