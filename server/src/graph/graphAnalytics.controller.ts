import type { RequestHandler } from "express";

import {
  getDegreeCentrality,
  getBetweennessCentrality,
  getLouvainCommunities,
} from "../modules/graph/graphAnalytics.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/ApiResponse.js";

export const degreeCentrality: RequestHandler = asyncHandler(
  async (_req, res) => {
    const results = await getDegreeCentrality();

    return res.status(200).json(
      successResponse(
        "Degree centrality calculated successfully",
        results,
      ),
    );
  },
);

export const betweennessCentrality: RequestHandler = asyncHandler(
  async (_req, res) => {
    const results = await getBetweennessCentrality();

    return res.status(200).json(
      successResponse(
        "Betweenness centrality calculated successfully",
        results,
      ),
    );
  },
);

export const louvainCommunities: RequestHandler = asyncHandler(
  async (_req, res) => {
    const results = await getLouvainCommunities();

    return res.status(200).json(
      successResponse(
        "Louvain communities calculated successfully",
        results,
      ),
    );
  },
);
