import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../../shared/error/globalError.js";
import { successResponse } from "../../utils/ApiResponse.js";
import CaseService from "./case.service.js";
import type { CaseProperties, CasePropertyValue } from "./case.types.js";

function requireCaseId(value: unknown): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new BadRequestError("Case id is required");
  }

  return value.trim();
}

function isCasePropertyValue(value: unknown): value is CasePropertyValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean",
    )
  );
}

function requireProperties(value: unknown): CaseProperties {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new BadRequestError("properties must be an object");
  }

  const properties = value as Record<string, unknown>;
  if (Object.keys(properties).length === 0) {
    throw new BadRequestError("properties cannot be empty");
  }

  if ("id" in properties) {
    throw new BadRequestError("Case id cannot be changed");
  }

  for (const property of Object.values(properties)) {
    if (!isCasePropertyValue(property)) {
      throw new BadRequestError(
        "Case properties must be strings, numbers, booleans, or arrays of those values",
      );
    }
  }

  return properties as CaseProperties;
}

export default class CaseController {
  private readonly caseService = new CaseService();

  async create(req: Request, res: Response): Promise<void> {
    const body = req.body as { id?: unknown; properties?: unknown };
    const caseRecord = await this.caseService.create(
      requireCaseId(body.id),
      requireProperties(body.properties),
    );

    res
      .status(StatusCodes.CREATED)
      .json(successResponse("Case created successfully", { case: caseRecord }));
  }

  async list(req: Request, res: Response): Promise<void> {
    const cases = await this.caseService.list();
    res.status(StatusCodes.OK).json(successResponse("Cases fetched successfully", { cases }));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const caseRecord = await this.caseService.findById(requireCaseId(req.params.id));
    res.status(StatusCodes.OK).json(successResponse("Case fetched successfully", { case: caseRecord }));
  }

  async update(req: Request, res: Response): Promise<void> {
    const caseRecord = await this.caseService.update(
      requireCaseId(req.params.id),
      requireProperties(req.body?.properties),
    );
    res.status(StatusCodes.OK).json(successResponse("Case updated successfully", { case: caseRecord }));
  }
}
