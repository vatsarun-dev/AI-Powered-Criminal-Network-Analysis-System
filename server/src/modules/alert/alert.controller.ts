import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/ApiResponse.js";
import AlertService from "./alert.service.js";
import { NotFoundError } from "../../shared/error/globalError.js";
import type { AlertStatus } from "../../types/alert.js";

const VALID_STATUSES: AlertStatus[] = ["NEW", "ACKNOWLEDGED", "DISMISSED"];

export default class AlertController {
  private readonly alertService = new AlertService();

  async listAlertsController(req: Request, res: Response): Promise<void> {
    const { caseId, status } = req.query;

    const result = await this.alertService.listAlerts(
      caseId as string | undefined,
      status as AlertStatus | undefined,
    );

    res
      .status(StatusCodes.OK)
      .json(successResponse("alerts fetched successfully", { data: result }));
  }

  async updateAlertStatusController(req: Request, res: Response): Promise<void> {
    const alertId = req.params.alertId as string;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      throw new NotFoundError("status must be one of NEW, ACKNOWLEDGED, DISMISSED");
    }

    const result = await this.alertService.updateStatus(alertId, status);

    res
      .status(StatusCodes.OK)
      .json(successResponse("alert updated successfully", { data: result }));
  }
}