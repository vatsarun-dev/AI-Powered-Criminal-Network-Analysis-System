import { Request, Response, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/ApiResponse.ts";
import FileService from "./file.service.ts";

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/error/globalError.ts";
import { FileType } from "../../types/file.ts";
export default class FileController {
  private readonly fileService = new FileService();

  async fileUploadController(req: Request, res: Response): RequestHandler {
    const { type, caseId } = req.body;
    if (!type || !caseId) throw new NotFoundError("no caseId found ");

    const file = req.file as FileType;
    const result = await this.fileService.fileUploadService(file, type, caseId);
    res
      .status(StatusCodes.OK)
      .json(successResponse("file uploaded successfully"), { data: result });
  }
}
