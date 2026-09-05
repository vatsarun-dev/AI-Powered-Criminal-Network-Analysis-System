import jwt, { type SignOptions } from "jsonwebtoken";
import env from "../config/env.js";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/auth.ts";

function signToken(payload: object, secret: string, expiresIn: string): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, secret, options);
}

export function generateAccessToken(
  payload: Omit<AccessTokenPayload, "type">,
): string {
  return signToken(
    { ...payload, type: "access" },
    env.ACCESS_TOKEN_SECRET,
    env.ACCESS_TOKEN_EXPIRES_IN,
  );
}

export function generateRefreshToken(
  payload: Omit<RefreshTokenPayload, "type">,
): string {
  return signToken(
    { ...payload, type: "refresh" },
    env.REFRESH_TOKEN_SECRET,
    env.REFRESH_TOKEN_EXPIRES_IN,
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
  if (typeof payload === "string" || payload.type !== "access") {
    throw new Error("Invalid access token");
  }
  return payload as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET);
  if (typeof payload === "string" || payload.type !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return payload as RefreshTokenPayload;
}
