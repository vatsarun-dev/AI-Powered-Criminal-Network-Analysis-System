import { Schema, model, Types } from "mongoose";

const entitySchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ["PERSON", "LOCATION", "ORGANIZATION"],
      required: true,
      index: true,
    },

    // Original value extracted from OCR/NER
    value: {
      type: String,
      required: true,
      trim: true,
    },

    // Cleaned value used for searching/resolution
    normalizedValue: {
      type: String,
      required: true,
      index: true,
    },

    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

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

    charOffset: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

entitySchema.index({
  sourceDocumentId: 1,
  pageNumber: 1,
});

entitySchema.index({
  entityType: 1,
  normalizedValue: 1,
});

export const EntityModel = model("Entity", entitySchema);
