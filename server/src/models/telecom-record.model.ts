import { model, Schema, Types } from "mongoose";

const telecomRecordSchema = new Schema(
  {
    sourceDocumentId: {
      type: Types.ObjectId,
      ref: "File",
      required: true,
      index: true,
    },
    caseId: {
      type: String,
      required: true,
      index: true,
    },
    recordType: {
      type: String,
      enum: ["CDR", "IPDR"],
      required: true,
      index: true,
    },
    rowNumber: {
      type: Number,
      required: true,
      min: 2,
    },
    rawRecord: {
      type: Schema.Types.Mixed,
      required: true,
    },
    normalizedRecord: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: String,
    },
    validationErrors: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

telecomRecordSchema.index({ sourceDocumentId: 1, rowNumber: 1 }, { unique: true });

export const TelecomRecordModel = model("TelecomRecord", telecomRecordSchema);
