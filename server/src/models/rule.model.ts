import { model, Schema } from "mongoose";
import type { Rule } from "../types/rule.js";

const ruleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    entityType: {
      type: String,
      required: true,
    },

    matchType: {
      type: String,
      enum: ["CONTAINS", "EQUALS", "REGEX"],
      required: true,
    },

    matchValue: {
      type: String,
      required: true,
    },

    caseId: {
      type: String,
      required: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const RuleModel = model<Rule>("Rule", ruleSchema);