import type { CookieOptions } from "express";
import env from "../config/env.js";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.COOKIE_SECURE
};

export const appConstant = {
  cookies: {
    accessTokenName: "access_token",
    refreshTokenName: "refresh_token",
    accessTokenOptions: {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000
    },
    refreshTokenOptions: {
      ...baseCookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000
    }
  }
} as const;
