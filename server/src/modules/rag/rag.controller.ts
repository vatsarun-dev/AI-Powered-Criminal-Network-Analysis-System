import type { Request, Response } from "express";

import { BadRequestError } from "../../shared/error/globalError.js";
import { successResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { answerRagQuery } from "./rag.service.js";

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const queryRag = asyncHandler(async (req: Request, res: Response) => {
  const query = optionalString(req.body?.query);
  if (!query || query.length > 2000) {
    throw new BadRequestError(
      "query is required and must be at most 2000 characters",
    );
  }

  const caseId = optionalString(req.body?.caseId);
  const entityId = optionalString(req.body?.entityId);
  const input = {
    query,
    ...(caseId ? { caseId } : {}),
    ...(entityId ? { entityId } : {}),
  };
  const data = await answerRagQuery(input);

  res
    .status(200)
    .json(successResponse("RAG query answered successfully", data));
});
