import { Schema, model, Types } from "mongoose";

import { NODE_LABELS, RELATIONSHIP_TYPES } from "../modules/graph/graph.constants.js";

/**
 * MongoDB retains the evidence-level relationship record. Neo4j receives a
 * graph edge with the same evidenceId, so a graph assertion always traces
 * back to its original document/page/entities.
 */
const relationshipEvidenceSchema = new Schema(
  {
    evidenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: RELATIONSHIP_TYPES,
      required: true,
      index: true,
    },
    fromEntityId: {
      type: Types.ObjectId,
      ref: "Entity",
      required: true,
      index: true,
    },
    fromLabel: {
      type: String,
      enum: NODE_LABELS,
      required: true,
    },
    toEntityId: {
      type: Types.ObjectId,
      ref: "Entity",
      required: true,
      index: true,
    },
    toLabel: {
      type: String,
      enum: NODE_LABELS,
      required: true,
    },
    sourceEntityIds: {
      type: [Types.ObjectId],
      ref: "Entity",
      required: true,
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
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    extractedEvidence: {
      type: String,
      required: true,
    },
    timestamp: {
      type: String,
    },
    modelVersion: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

relationshipEvidenceSchema.index({ sourceDocumentId: 1, pageNumber: 1 });
relationshipEvidenceSchema.index({ fromEntityId: 1, toEntityId: 1, relationshipType: 1 });

export const RelationshipEvidenceModel = model(
  "RelationshipEvidence",
  relationshipEvidenceSchema,
);
