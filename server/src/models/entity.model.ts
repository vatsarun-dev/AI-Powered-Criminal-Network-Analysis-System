import { Schema, model, Types } from "mongoose";
import { ENTITY_TYPES, EXTRACTION_SOURCES } from "../types/entity.js";

const entitySchema = new Schema(
  {
    entityType: {
      type: String,
      enum: ENTITY_TYPES,
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

    // Records whether ML, deterministic rules, or both produced this entity.
    extractionSources: {
      type: [String],
      enum: EXTRACTION_SOURCES,
      default: ["NER"],
    },

    // Keeps every raw variant when overlapping extractors are de-duplicated.
    originalValues: {
      type: [String],
      default: [],
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
