import type { RequestHandler } from "express";
import { successResponse } from "../../utils/ApiResponse.js";

export default class HealthController {
  status: RequestHandler = (req, res) => {
    res.status(200).json(successResponse("API is running", { uptime: process.uptime() }));
  };
}
