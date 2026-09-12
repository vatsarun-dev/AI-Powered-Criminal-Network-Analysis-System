import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/ApiResponse.js";
import FileService from "./file.service.js";

import { BadRequestError } from "../../shared/error/globalError.js";
export default class FileController {
  private readonly fileService = new FileService();

  async fileUploadController(req: Request, res: Response): Promise<void> {
    const { type, caseId } = req.body;
    if (typeof type !== "string" || typeof caseId !== "string" || !type.trim() || !caseId.trim()) {
      throw new BadRequestError("type and caseId are required");
    }

    if (!req.file) throw new BadRequestError("file is required");

    const file = req.file as Express.Multer.File;
    const result = await this.fileService.fileUploadService(file, type.trim(), caseId.trim());
    res
      .status(StatusCodes.OK)
      .json(successResponse("file uploaded successfully", { data: result }));
  }

  async searchFilesController(req: Request, res: Response): Promise<void> {
    const { name, date, location, case: caseId } = req.query;

    const result = await this.fileService.searchFilesService({
      name: name as string,
      date: date as string,
      location: location as string,
      caseId: caseId as string,
    });

    res
      .status(StatusCodes.OK)
      .json(successResponse("files fetched successfully", { data: result }));
  }
}
