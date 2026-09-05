import { Request, Response, RequestHandler } from "express";
import { FileType, File } from "../../types/file.js";
import { FileModel } from "../../models/file.model.js";
import { FileResponse } from "../../types/Response.js";

interface fileReturnType {
  file: Express.Multer.File;
  type: "PDF" | "CDR" | "IPDR";
  caseId: string;
}

export default class FileService {
  private response(uploadedFile: File): FileResponse {
    return {
      fileId: (uploadedFile as File & { _id: string })._id,
      originalName: uploadedFile.originalName,
      type: uploadedFile.type,
      size: String(uploadedFile.size),
      status: uploadedFile.status,
    };
  }

  async fileUploadService(
    file: FileType,
    type: string,
    caseId: string,
  ): Promise<FileResponse> {
    if (!file || !type || !caseId)
      throw new Error("all fields are required");

    const uploadedFile = await FileModel.create({
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: Number((file as FileType & { size?: number }).size ?? 0),
      type,
      caseId,
      storagePath: file.path,
      status: "UPLOADED",
    });

    const response = this.response(uploadedFile);
    return response;
  }
}
