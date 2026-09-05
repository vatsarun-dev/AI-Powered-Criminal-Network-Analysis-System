import type { Request, Response } from "express";
import UserRepo from "../../repository/user.repo.js";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/error/globalError.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/token.js";
import type { AuthUser } from "../../types/auth.ts";
import type {
  RegisterUserRequest,
  LoginUserRequest,
  AuthResponseUser,
} from "../../types/Response.ts";
import { appConstant } from "../../constant/appConstant.js";
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
      name: "name" in user ? String(user.name) : "",
      email: user.email,
      role: user.role === "admin" ? "admin" : "user",
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
      appConstant.cookies.accessTokenName,
      accessToken,
      appConstant.cookies.accessTokenOptions,
    );
    res.cookie(
      appConstant.cookies.refreshTokenName,
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

    const passwordMatches = await (
      user as typeof user & {
        comparePassword(password: string): Promise<boolean>;
      }
    ).comparePassword(input.password);

    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const responseUser = this.toResponseUser(user);
    await this.issueAuthCookies(responseUser, res);

    return responseUser;
  }

  async refreshService(req: Request, res: Response): Promise<AuthResponseUser> {
    const refreshToken = req.cookies[appConstant.cookies.refreshTokenName] as
      | string
      | undefined;
    if (!refreshToken) throw new UnauthorizedError("Refresh token missing");

    let tokenPayload;
    try {
      tokenPayload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const user = await this.userRepo.findByRefreshToken(refreshToken);
    if (!user || user.id !== tokenPayload.id || user.email !== tokenPayload.email) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const responseUser = this.toResponseUser(user);
    await this.issueAuthCookies(responseUser, res);
    return responseUser;
  }

  async logoutService(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies[appConstant.cookies.refreshTokenName] as
      | string
      | undefined;

    if (refreshToken) {
      const user = await this.userRepo.findByRefreshToken(refreshToken);
      if (user) {
        await this.userRepo.clearRefreshToken(user.id);
      }
    }

    res.clearCookie(
      appConstant.cookies.accessTokenName,
      appConstant.cookies.accessTokenOptions,
    );
    res.clearCookie(
      appConstant.cookies.refreshTokenName,
      appConstant.cookies.refreshTokenOptions,
    );
  }

  async getMeService(req: Request, res: Response): Promise<AuthResponseUser> {
    const id = req.user?.id;
    if (!id) throw new UnauthorizedError("Unauthorized");
    const user = await this.userRepo.findById(id);

    if (!user) throw new NotFoundError("no user  found");

    return this.toResponseUser(user);
  }
}
