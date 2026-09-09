import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

import { BadRequestError } from "../../shared/error/globalError.js";
import { successResponse } from "../../utils/ApiResponse.js";
import FirService from "./fir.service.js";
import {
  parseFirCreateInput,
  parseFirListFilter,
  parseFirUpdateInput,
} from "./fir.validation.js";

const requireFirId = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError("FIR id is required");
  }
  const id = value.trim();
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestError("FIR id must be a valid MongoDB ObjectId");
  }
  return id;
};

const parseOptionalPageNumber = (value: unknown): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1) {
    throw new BadRequestError("pageNumber must be a positive integer");
  }
  return Number(value);
};

const parseDepth = (value: unknown): number => {
  if (value === undefined) return 2;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new BadRequestError("depth must be an integer between 1 and 3");
  }
  const depth = Number(value);
  if (depth < 1 || depth > 3) {
    throw new BadRequestError("depth must be an integer between 1 and 3");
  }
  return depth;
};

export default class FirController {
  private readonly firService = new FirService();

  async create(req: Request, res: Response): Promise<void> {
    const fir = await this.firService.create(parseFirCreateInput(req.body));
    res.status(StatusCodes.CREATED).json(successResponse("FIR created successfully", { fir }));
  }

  async list(req: Request, res: Response): Promise<void> {
    const result = await this.firService.list(
      parseFirListFilter(req.query as Record<string, unknown>),
    );
    res.status(StatusCodes.OK).json(successResponse("FIRs fetched successfully", result));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const fir = await this.firService.findById(requireFirId(req.params.id));
    res.status(StatusCodes.OK).json(successResponse("FIR fetched successfully", { fir }));
  }

  async update(req: Request, res: Response): Promise<void> {
    const fir = await this.firService.update(
      requireFirId(req.params.id),
      parseFirUpdateInput(req.body),
    );
    res.status(StatusCodes.OK).json(successResponse("FIR updated successfully", { fir }));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const fir = await this.firService.delete(requireFirId(req.params.id));
    res.status(StatusCodes.OK).json(successResponse("FIR deleted successfully", { fir }));
  }

  async evidence(req: Request, res: Response): Promise<void> {
    const evidence = await this.firService.evidence(
      requireFirId(req.params.id),
      parseOptionalPageNumber(req.query.pageNumber),
    );
    res.status(StatusCodes.OK).json(successResponse("FIR evidence fetched successfully", evidence));
  }

  async network(req: Request, res: Response): Promise<void> {
    const data = await this.firService.network(
      requireFirId(req.params.id),
      parseDepth(req.query.depth),
    );
    res.status(StatusCodes.OK).json(successResponse("FIR network fetched successfully", data));
  }
}
