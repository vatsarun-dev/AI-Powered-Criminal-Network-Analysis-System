import { Request, Response, RequestHandler } from "express";
import { FileType, File } from "../../types/file.ts";
import { FileModel } from "../../models/file.model.ts";
import { FileResponse } from "../../types/Response.ts";

interface fileReturnType {
  file: Express.Multer.File;
  type: "PDF" | "CDR" | "IPDR";
  caseId: string;
}
export default class FileService {
  private response(uploadedFile: File): FileResponse {
    return {
      fileId: uploadedFile._id,
      originalName: uploadedFile.originalName,
      type: uploadedFile.type,
      size: uploadedFile.size,
      status: uploadedFile.status,
    };
  }

  async fileUploadService(
    file: FileType,
    type: string,
    caseId: string,
  ): fileReturnType {
    if (!file || !type || !caseId)
      throw new NotFoundError("all fields are required");

    const uploadedFile = await FileModel.create({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      type,
      caseId,
      storagePath: file.path,
      status: "UPLOADED",
    });

    const response = this.response(uploadedFile);
    return response;
  }
}
