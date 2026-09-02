import type { RequestHandler } from "express";
import { appConstant } from "../constant/appConstant.js";
import { UnauthorizedError } from "../shared/error/globalError.js";
import { verifyAccessToken } from "../utils/token.js";

const authMiddleware: RequestHandler = (req, res, next) => {
  try {
    const accessToken = req.cookies[appConstant.cookies.accessTokenName] as string | undefined;

    if (!accessToken) {
      throw new UnauthorizedError("Access token missing");
    }

    req.user = verifyAccessToken(accessToken);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired access token"));
  }
};

export default authMiddleware;
