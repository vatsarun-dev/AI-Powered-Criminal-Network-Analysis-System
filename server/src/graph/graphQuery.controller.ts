import type { Request, Response } from "express";

import {
  BadRequestError,
  NotFoundError,
} from "../shared/error/globalError.js";

import {
  searchGraphNodes,
  getNodeConnections,
  getShortestPath,
} from "./graphQuery.service.js";

export const searchNodes = async (
  req: Request,
  res: Response
) => {
  const search = String(req.query.search || "").trim();

  if (!search) {
    throw new BadRequestError(
      "Search query is required"
    );
  }

  const results = await searchGraphNodes(search);

  return res.status(200).json({
    success: true,
    message: "Graph nodes searched successfully",
    data: results,
  });
};

export const nodeConnections = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!id || Array.isArray(id)) {
    throw new BadRequestError(
      "Node id is required"
    );
  }

  const results = await getNodeConnections(id);

  if (results.length === 0) {
    throw new NotFoundError(
      "Node not found or has no connections"
    );
  }

  return res.status(200).json({
    success: true,
    message: "Node connections fetched successfully",
    data: results,
  });
};

export const shortestPath = async (
  req: Request,
  res: Response
) => {
  const from = String(req.query.from || "").trim();
  const to = String(req.query.to || "").trim();

  if (!from || !to) {
    throw new BadRequestError(
      "Both from and to node ids are required"
    );
  }

  const result = await getShortestPath(from, to);

  if (!result) {
    throw new NotFoundError(
      "No path found between the specified nodes"
    );
  }

  return res.status(200).json({
    success: true,
    message: "Shortest path calculated successfully",
    data: result,
  });
};