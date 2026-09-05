import { Schema, model, Types } from "mongoose";

const ocrResultSchema = new Schema(
  {
    sourceDocumentId: {
      type: Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },

    pageNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    text: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  },
);

ocrResultSchema.index({ sourceDocumentId: 1, pageNumber: 1 }, { unique: true });

export const OCRResult = model("OCRResult", ocrResultSchema);
