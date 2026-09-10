import type { Request, Response } from "express";

import {
  BadRequestError,
  NotFoundError,
} from "../../shared/error/globalError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { successResponse } from "../../utils/ApiResponse.js";

import {
  getCaseNetwork,
  getGraphNeighbors,
  getGraphNode,
  getGraphRelationships,
  searchGraphNodes,
  getNodeConnections,
  getPersonNetwork,
  getShortestPath,
} from "./graphQuery.service.js";
import { NODE_LABELS, RELATIONSHIP_TYPES } from "./graph.constants.js";

const readCsvQuery = (value: unknown): string[] =>
  typeof value === "string"
    ? [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))]
    : [];

const readBoundedNumber = (
  value: unknown,
  defaultValue: number,
  minimum: number,
  maximum: number,
): number => {
  if (value === undefined) return defaultValue;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new BadRequestError(
      `Value must be an integer between ${minimum} and ${maximum}`,
    );
  }

  return parsed;
};

const requireNodeId = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError("Node id is required");
  }

  return value.trim();
};

export const searchNodes = asyncHandler(async (req: Request, res: Response) => {
  const search = String(req.query.search || "").trim();

  if (!search) {
    throw new BadRequestError("Search query is required");
  }

  const results = await searchGraphNodes(search);

  res
    .status(200)
    .json(successResponse("Graph nodes searched successfully", results));
});

export const nodeConnections = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new BadRequestError("Node id is required");
    }

    const results = await getNodeConnections(id);

    if (results.length === 0) {
      throw new NotFoundError("Node not found or has no connections");
    }

    res
      .status(200)
      .json(successResponse("Node connections fetched successfully", results));
  },
);

export const shortestPath = asyncHandler(
  async (req: Request, res: Response) => {
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    if (!from || !to) {
      throw new BadRequestError("Both from and to node ids are required");
    }

    const result = await getShortestPath(from, to);

    if (!result) {
      throw new NotFoundError("No path found between the specified nodes");
    }

    res
      .status(200)
      .json(successResponse("Shortest path calculated successfully", result));
  },
);

export const getNode = asyncHandler(async (req: Request, res: Response) => {
  const node = await getGraphNode(requireNodeId(req.params.id));
  if (!node) {
    throw new NotFoundError("Graph node not found");
  }

  res.status(200).json(successResponse("Graph node fetched successfully", node));
});

export const getNeighbors = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const result = await getGraphNeighbors(requireNodeId(req.params.id));
      res
        .status(200)
        .json(successResponse("Graph neighbors fetched successfully", result));
    } catch (error) {
      if (error instanceof Error && error.message === "GRAPH_NODE_NOT_FOUND") {
        throw new NotFoundError("Graph node not found");
      }

      throw error;
    }
  },
);

export const listRelationships = asyncHandler(
  async (req: Request, res: Response) => {
    const nodeLabels = readCsvQuery(req.query.labels);
    const relationshipTypes = readCsvQuery(req.query.relationshipTypes);
    const invalidLabels = nodeLabels.filter(
      (label) => !NODE_LABELS.includes(label as (typeof NODE_LABELS)[number]),
    );
    const invalidRelationshipTypes = relationshipTypes.filter(
      (type) =>
        !RELATIONSHIP_TYPES.includes(
          type as (typeof RELATIONSHIP_TYPES)[number],
        ),
    );

    if (invalidLabels.length) {
      throw new BadRequestError(
        `Invalid node labels: ${invalidLabels.join(", ")}`,
      );
    }
    if (invalidRelationshipTypes.length) {
      throw new BadRequestError(
        `Invalid relationship types: ${invalidRelationshipTypes.join(", ")}`,
      );
    }

    const nodeId =
      typeof req.query.nodeId === "string" && req.query.nodeId.trim()
        ? req.query.nodeId.trim()
        : undefined;
    const sourceDocumentId =
      typeof req.query.sourceDocumentId === "string" &&
      req.query.sourceDocumentId.trim()
        ? req.query.sourceDocumentId.trim()
        : undefined;
    const data = await getGraphRelationships({
      ...(nodeId ? { nodeId } : {}),
      ...(nodeLabels.length
        ? { nodeLabels: nodeLabels as (typeof NODE_LABELS)[number][] }
        : {}),
      ...(relationshipTypes.length
        ? {
            relationshipTypes:
              relationshipTypes as (typeof RELATIONSHIP_TYPES)[number][],
          }
        : {}),
      ...(sourceDocumentId ? { sourceDocumentId } : {}),
      limit: readBoundedNumber(req.query.limit, 100, 1, 500),
    });

    res
      .status(200)
      .json(successResponse("Graph relationships fetched successfully", data));
  },
);

/**
 * Frontend-oriented alias: the response is a complete `{ nodes,
 * relationships }` subgraph, constrained by the same safe filters.
 */
export const filteredGraph = listRelationships;

export const caseNetwork = asyncHandler(async (req: Request, res: Response) => {
  const data = await getCaseNetwork(
    requireNodeId(req.params.id),
    readBoundedNumber(req.query.depth, 2, 1, 3),
  );
  if (!data) {
    throw new NotFoundError("Case graph node not found");
  }

  res.status(200).json(successResponse("Case network fetched successfully", data));
});

export const personNetwork = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getPersonNetwork(
      requireNodeId(req.params.id),
      readBoundedNumber(req.query.depth, 2, 1, 3),
    );
    if (!data) {
      throw new NotFoundError("Person graph node not found");
    }

    res
      .status(200)
      .json(successResponse("Person network fetched successfully", data));
  },
);