import type { Response } from "express";
import UserRepo from "../../repository/user.repo.js";
import { appConstant } from "../../constant/appConstant.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../../shared/error/globalError.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/token.js";
import type { AuthUser } from "../../types/auth.js";

export type RegisterUserRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginUserRequest = {
  email: string;
  password: string;
};

export type AuthResponseUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default class AuthService {
  private readonly userRepo = new UserRepo();

  async register(input: RegisterUserRequest, res: Response): Promise<AuthResponseUser> {
    const existingUser = await this.userRepo.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    const user = await this.userRepo.createUser(input);
    const responseUser = this.toResponseUser(user);

    await this.issueAuthCookies(responseUser, res);

    return responseUser;
  }

  async login(input: LoginUserRequest, res: Response): Promise<AuthResponseUser> {
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

  async refresh(refreshToken: string | undefined, res: Response): Promise<void> {
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token missing");
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await this.userRepo.findByRefreshToken(refreshToken);

    if (!user || String(user._id) !== payload.id) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const accessToken = generateAccessToken({
      id: payload.id,
      email: payload.email,
      role: payload.role
    });

    res.cookie(appConstant.cookies.accessTokenName, accessToken, appConstant.cookies.accessTokenOptions);
  }

  async logout(user: AuthUser | undefined, res: Response): Promise<void> {
    if (user) {
      await this.userRepo.clearRefreshToken(user.id);
    }

    res.clearCookie(appConstant.cookies.accessTokenName, appConstant.cookies.accessTokenOptions);
    res.clearCookie(appConstant.cookies.refreshTokenName, appConstant.cookies.refreshTokenOptions);
  }

  async getCurrentUser(user: AuthUser | undefined): Promise<AuthResponseUser> {
    if (!user) {
      throw new UnauthorizedError("User not authenticated");
    }

    const currentUser = await this.userRepo.findById(user.id);

    if (!currentUser) {
      throw new NotFoundError("User not found");
    }

    return this.toResponseUser(currentUser);
  }

  private async issueAuthCookies(user: AuthResponseUser, res: Response): Promise<void> {
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await this.userRepo.saveRefreshToken(user.id, refreshToken);

    res.cookie(appConstant.cookies.accessTokenName, accessToken, appConstant.cookies.accessTokenOptions);
    res.cookie(appConstant.cookies.refreshTokenName, refreshToken, appConstant.cookies.refreshTokenOptions);
  }

  private toResponseUser(user: { _id: unknown; name: string; email: string; role: string }): AuthResponseUser {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}
