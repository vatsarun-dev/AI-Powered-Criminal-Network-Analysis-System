import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { NotFoundError } from "../../shared/error/globalError.js";
import { successResponse } from "../../utils/ApiResponse.js";
import CrimeAnalyticsService from "./analytics.service.js";
import {
  parseAnalyticsFilter,
  parseAnalyticsLimit,
  parseAnalyticsRole,
  requireGraphNodeId,
} from "./analytics.validation.js";

export default class AnalyticsController {
  private readonly analyticsService = new CrimeAnalyticsService();

  async crimeCategories(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.crimeCategories(
      parseAnalyticsFilter(req.query as Record<string, unknown>),
    );
    res.status(StatusCodes.OK).json(successResponse("Crime category analytics fetched successfully", data));
  }

  async districts(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.districts(
      parseAnalyticsFilter(req.query as Record<string, unknown>),
    );
    res.status(StatusCodes.OK).json(successResponse("District analytics fetched successfully", data));
  }

  async gender(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.demographics(
      "gender",
      parseAnalyticsRole(req.query.role),
      parseAnalyticsFilter(req.query as Record<string, unknown>),
    );
    res.status(StatusCodes.OK).json(successResponse("Gender aggregate analytics fetched successfully", data));
  }

  async religion(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.demographics(
      "religion",
      parseAnalyticsRole(req.query.role),
      parseAnalyticsFilter(req.query as Record<string, unknown>),
    );
    res.status(StatusCodes.OK).json(successResponse("Religion aggregate analytics fetched successfully", data));
  }

  async degree(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.graphDegree(parseAnalyticsLimit(req.query.limit));
    res.status(StatusCodes.OK).json(successResponse("Graph degree centrality fetched successfully", { results: data }));
  }

  async betweenness(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.graphBetweenness(parseAnalyticsLimit(req.query.limit));
    res.status(StatusCodes.OK).json(successResponse("Graph betweenness centrality fetched successfully", { results: data }));
  }

  async communities(_req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.graphCommunities();
    res.status(StatusCodes.OK).json(successResponse("Graph community detection fetched successfully", {
      algorithm: "LOUVAIN",
      communities: data,
    }));
  }

  async shortestPath(req: Request, res: Response): Promise<void> {
    const data = await this.analyticsService.graphShortestPath(
      requireGraphNodeId(req.query.from, "from"),
      requireGraphNodeId(req.query.to, "to"),
    );
    if (!data) {
      throw new NotFoundError("No graph path found between the specified nodes");
    }
    res.status(StatusCodes.OK).json(successResponse("Graph shortest path fetched successfully", { path: data }));
  }
}
