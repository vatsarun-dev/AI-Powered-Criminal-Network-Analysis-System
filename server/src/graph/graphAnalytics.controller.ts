import type { Request, Response } from "express";

import {
  getDegreeCentrality,
  getBetweennessCentrality,
  getLouvainCommunities,
} from "./graphAnalytics.service.js";

export const degreeCentrality = async (
  _req: Request,
  res: Response
) => {
  try {
    const results = await getDegreeCentrality();

    return res.status(200).json({
      message: "Degree centrality calculated successfully",
      results,
    });
  } catch (error) {
    console.error("Degree centrality error:", error);

    return res.status(500).json({
      message: "Failed to calculate degree centrality",
    });
  }
};
export const betweennessCentrality = async (
  _req: Request,
  res: Response
) => {
  try {
    const results = await getBetweennessCentrality();

    return res.status(200).json({
      message: "Betweenness centrality calculated successfully",
      results,
    });
  } catch (error) {
    console.error("Betweenness centrality error:", error);

    return res.status(500).json({
      message: "Failed to calculate betweenness centrality",
    });
  }
};
export const louvainCommunities = async (
  _req: Request,
  res: Response
) => {
  try {
    const results = await getLouvainCommunities();

    return res.status(200).json({
      message: "Louvain communities detected successfully",
      results,
    });
  } catch (error) {
    console.error("Louvain community detection error:", error);

    return res.status(500).json({
      message: "Failed to detect communities",
    });
  }
};