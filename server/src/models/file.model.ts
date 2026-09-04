import { model, Schema } from "mongoose";
import type { File } from "../types/file.ts";
const fileSchema = new Schema(
  {
    originalName: {
      type: String,
      required: true,
    },

    storedName: {
      type: String,
      required: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      enum: ["FIR", "CDR", "IPDR"],
      required: true,
    },

    caseId: {
      type: String,
      required: true,
    },

    storagePath: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["UPLOADED", "PROCESSING", "PROCESSED", "FAILED"],
      default: "UPLOADED",
    },
  },
  {
    timestamps: true,
  },
);

export const FileModel = model<File>("File", fileSchema);
