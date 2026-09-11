import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { BadRequestError } from "../../shared/error/globalError.js";
import { successResponse } from "../../utils/ApiResponse.js";
import RagService from "./rag.service.js";

export default class RagController {
  private readonly ragService = new RagService();

  async ask(req: Request, res: Response): Promise<void> {
    const { firId, question } = req.body as { firId?: unknown; question?: unknown };
    if (typeof firId !== "string" || !Types.ObjectId.isValid(firId)) throw new BadRequestError("firId must be a valid FIR id");
    if (typeof question !== "string" || question.trim().length < 3 || question.length > 2000) throw new BadRequestError("question must be between 3 and 2000 characters");
    const result = await this.ragService.ask(firId, question.trim());
    res.status(StatusCodes.OK).json(successResponse("Grounded FIR answer generated", result));
  }
}
