import path from "node:path";

import { FileType, File } from "../../types/file.js";
import { FileModel } from "../../models/file.model.js";
import { FileResponse } from "../../types/Response.js";
import { extractTextFromPdf } from "../../service/pdf-ocr.service.ts";

interface FileReturnType {
  file: Express.Multer.File;
  type: "FIR" | "CDR" | "IPDR";
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
    if (!file || !type || !caseId) {
      throw new Error("all fields are required");
    }

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

    /*
     * OCR is currently required only for FIR/PDF files.
     */
    if (type === "FIR" && file.mimetype === "application/pdf") {
      await FileModel.findByIdAndUpdate(uploadedFile._id, {
        status: "PROCESSING",
      });

      try {
        const outputDirectory = path.dirname(file.path);

        await extractTextFromPdf(
          file.path,
          outputDirectory,
          String(uploadedFile._id),
        );

        await FileModel.findByIdAndUpdate(uploadedFile._id, {
          status: "PROCESSED",
        });
      } catch (error) {
        await FileModel.findByIdAndUpdate(uploadedFile._id, {
          status: "FAILED",
        });

        throw error;
      }
    }

    const updatedFile = await FileModel.findById(uploadedFile._id);

    if (!updatedFile) {
      throw new Error("uploaded file not found");
    }

    return this.response(updatedFile);
  }
}
