import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { NotFoundError } from "../../shared/error/globalError.js";
import { successResponse } from "../../utils/ApiResponse.js";
import CrimeMapService from "./map.service.js";
import { parseCrimeMapFilter, requireMapLocationId } from "./map.validation.js";

export default class CrimeMapController {
  private readonly mapService = new CrimeMapService();

  async overview(req: Request, res: Response): Promise<void> {
    const data = await this.mapService.overview(
      parseCrimeMapFilter(req.query as Record<string, unknown>),
    );
    res.status(StatusCodes.OK).json(successResponse("Crime map data fetched successfully", data));
  }

  async districtDetails(req: Request, res: Response): Promise<void> {
    const filter = {
      ...parseCrimeMapFilter(req.query as Record<string, unknown>),
      groupBy: "DISTRICT" as const,
    };
    const data = await this.mapService.details(requireMapLocationId(req.params.id), filter);
    if (!data) throw new NotFoundError("District map data not found");
    res.status(StatusCodes.OK).json(successResponse("District map details fetched successfully", data));
  }

  async policeStationDetails(req: Request, res: Response): Promise<void> {
    const filter = {
      ...parseCrimeMapFilter(req.query as Record<string, unknown>),
      groupBy: "POLICE_STATION" as const,
    };
    const data = await this.mapService.details(requireMapLocationId(req.params.id), filter);
    if (!data) throw new NotFoundError("Police station map data not found");
    res.status(StatusCodes.OK).json(successResponse("Police station map details fetched successfully", data));
  }
}
