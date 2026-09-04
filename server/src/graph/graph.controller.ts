import type { Request, Response } from "express";

import {
  NODE_LABELS,
  RELATIONSHIP_TYPES,
} from "./graph.constants.js";

import {
  createNode,
  createRelationship,
} from "./graph.service.js";

export const createGraphNode = async (
  req: Request,
  res: Response
) => {
  try {
    const { label, properties } = req.body;

    if (!NODE_LABELS.includes(label)) {
      return res.status(400).json({
        message: "Invalid node label",
      });
    }

    if (!properties || !properties.id) {
      return res.status(400).json({
        message: "Node properties must contain an id",
      });
    }

    const node = await createNode(label, properties);

    return res.status(201).json({
      message: "Node created successfully",
      node,
    });
  } catch (error) {
    console.error("Create node error:", error);

    return res.status(500).json({
      message: "Failed to create graph node",
    });
  }
};

export const createGraphRelationship = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      from,
      relationship,
      to,
      properties,
    } = req.body;

    if (!NODE_LABELS.includes(from?.label)) {
      return res.status(400).json({
        message: "Invalid source node label",
      });
    }

    if (!NODE_LABELS.includes(to?.label)) {
      return res.status(400).json({
        message: "Invalid target node label",
      });
    }

    if (!RELATIONSHIP_TYPES.includes(relationship)) {
      return res.status(400).json({
        message: "Invalid relationship type",
      });
    }

    const result = await createRelationship(
      from.label,
      from.id,
      relationship,
      to.label,
      to.id,
      properties
    );

    return res.status(201).json({
      message: "Relationship created successfully",
      relationship: result,
    });
  } catch (error) {
    console.error("Create relationship error:", error);

    return res.status(500).json({
      message: "Failed to create graph relationship",
    });
  }
};