import { model, Schema } from "mongoose";
import type { Alert } from "../types/alert.js";

const alertSchema = new Schema(
  {
    ruleId: {
      type: Schema.Types.ObjectId,
      ref: "Rule",
      required: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      ref: "Entity",
      required: true,
    },

    caseId: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["NEW", "ACKNOWLEDGED", "DISMISSED"],
      default: "NEW",
    },

    triggeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export const AlertModel = model<Alert>("Alert", alertSchema);