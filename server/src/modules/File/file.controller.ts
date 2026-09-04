import { Request, Response, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/ApiResponse.js";
import FileService from "./file.service.js";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/error/globalError.js";
import { FileType } from "../../types/file.js";
export default class FileController {
  private readonly fileService = new FileService();

  async fileUploadController(req: Request, res: Response): Promise<void> {
    const { type, caseId } = req.body;
    if (!type || !caseId) throw new NotFoundError("no caseId found ");

    if (!req.file) throw new NotFoundError("no file found");

    const file = req.file as unknown as FileType;
    const result = await this.fileService.fileUploadService(file, type, caseId);
    res
      .status(StatusCodes.OK)
      .json(successResponse("file uploaded successfully", { data: result }));
  }
}
