import path from "node:path";
import { Types } from "mongoose";

import { FileType, File } from "../../types/file.js";
import { FileModel } from "../../models/file.model.js";
import { FirModel } from "../../models/fir.model.js";
import { FileResponse } from "../../types/Response.js";
import { extractTextFromPdf } from "../../service/pdf-ocr.service.js";

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
    ...(uploadedFile.location ? { location: uploadedFile.location } : {}),
  };
}

  async fileUploadService(
  file: Express.Multer.File,
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
      size: Number(file.size ?? 0),
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

    // When the supplied caseId is an existing FIR id, make its evidence
    // source explicit so existing FIR, map, graph and RAG queries use this
    // real uploaded document. Other legacy case identifiers remain supported.
    if (type === "FIR" && Types.ObjectId.isValid(caseId)) {
      await FirModel.findByIdAndUpdate(caseId, {
        $set: { sourceDocument: uploadedFile._id },
      });
    }

    return this.response(updatedFile);
  }

  /**
   * Search / filter files by name, date, location, and/or case.
   * All filters are optional — only the provided ones are applied.
   */
  async searchFilesService(filters: {
    name?: string;
    date?: string;
    location?: string;
    caseId?: string;
  }): Promise<FileResponse[]> {
    const query: Record<string, unknown> = {};

    if (filters.name) {
      query.originalName = { $regex: filters.name, $options: "i" };
    }

    if (filters.location) {
      query.location = { $regex: filters.location, $options: "i" };
    }

    if (filters.caseId) {
      query.caseId = filters.caseId;
    }

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    const files = await FileModel.find(query);
    return files.map((file) => this.response(file));
  }
}
