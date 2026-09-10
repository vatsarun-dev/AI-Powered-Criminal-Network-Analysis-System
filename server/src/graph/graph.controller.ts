import type { RequestHandler } from "express";

import { NODE_LABELS, RELATIONSHIP_TYPES } from "../modules/graph/graph.constants.js";
import {
  createNode,
  createRelationship,
} from "../modules/graph/graph.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/ApiResponse.js";

export const createGraphNode: RequestHandler = asyncHandler(
  async (req, res) => {
    const { label, properties } = req.body;

    if (!NODE_LABELS.includes(label)) {
      return res.status(400).json({
        success: false,
        message: "Invalid node label",
      });
    }

    if (!properties?.id) {
      return res.status(400).json({
        success: false,
        message: "Node properties must contain an id",
      });
    }

    const node = await createNode(label, properties);

    return res.status(201).json(
      successResponse("Node created successfully", node),
    );
  },
);

export const createGraphRelationship: RequestHandler = asyncHandler(
  async (req, res) => {
    const { from, relationship, to, properties } = req.body;

    if (!NODE_LABELS.includes(from?.label)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source node label",
      });
    }

    if (!NODE_LABELS.includes(to?.label)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target node label",
      });
    }

    if (!RELATIONSHIP_TYPES.includes(relationship)) {
      return res.status(400).json({
        success: false,
        message: "Invalid relationship type",
      });
    }

    const result = await createRelationship(
      from.label,
      from.id,
      relationship,
      to.label,
      to.id,
      properties,
    );

    return res.status(201).json(
      successResponse("Relationship created successfully", result),
    );
  },
);
