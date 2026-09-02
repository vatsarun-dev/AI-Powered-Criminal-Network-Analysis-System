import type { Response } from "express";
import UserRepo from "../../repository/user.repo.js";
import { appConstant } from "../../constant/appConstant.js";
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

  async register(
    input: RegisterUserRequest,
    res: Response,
  ): Promise<AuthResponseUser> {
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
