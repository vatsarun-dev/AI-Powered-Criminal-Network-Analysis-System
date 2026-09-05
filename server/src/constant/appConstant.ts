import type { CookieOptions } from "express";
import env from "../config/env.js";
const secures = env.NODE_ENV === "production";

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: secures ? "strict" : "lax",
  secure: env.COOKIE_SECURE,
};

export const appConstant = {
  cookies: {
    accessTokenName: "accessToken",
    refreshTokenName: "refreshToken",
    accessTokenOptions: {
      ...baseCookieOptions,
      maxAge: 15 * 60 * 1000,
    },
    refreshTokenOptions: {
      ...baseCookieOptions,
      maxAge: 15 * 24 * 60 * 60 * 1000,
    },
  },
};
