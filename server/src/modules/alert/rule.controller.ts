import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { successResponse } from "../../utils/ApiResponse.js";
import RuleService from "./rule.service.js";
import { NotFoundError } from "../../shared/error/globalError.js";

export default class RuleController {
  private readonly ruleService = new RuleService();

  async createRuleController(req: Request, res: Response): Promise<void> {
    const { name, entityType, matchType, matchValue, caseId } = req.body;

    if (!name || !entityType || !matchType || !matchValue) {
      throw new NotFoundError("name, entityType, matchType and matchValue are required");
    }

    const createdBy = (req as Request & { user?: { id: string } }).user?.id ?? "unknown";

    const result = await this.ruleService.createRule(
      { name, entityType, matchType, matchValue, caseId },
      createdBy,
    );

    res
      .status(StatusCodes.CREATED)
      .json(successResponse("rule created successfully", { data: result }));
  }

  async listRulesController(req: Request, res: Response): Promise<void> {
    const { caseId } = req.query;
    const result = await this.ruleService.listRules(caseId as string | undefined);

    res
      .status(StatusCodes.OK)
      .json(successResponse("rules fetched successfully", { data: result }));
  }

  async toggleRuleController(req: Request, res: Response): Promise<void> {
    const ruleId = req.params.ruleId as string;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      throw new NotFoundError("isActive (boolean) is required");
    }

    const result = await this.ruleService.toggleRule(ruleId, isActive);

    res
      .status(StatusCodes.OK)
      .json(successResponse("rule updated successfully", { data: result }));
  }
}