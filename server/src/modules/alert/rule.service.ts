import { RuleModel } from "../../models/rule.model.js";
import { NotFoundError } from "../../shared/error/globalError.js";
import type { CreateRuleRequest, MatchType, RuleResponse } from "../../types/rule.js";

type RuleDocument = {
  _id: unknown;
  name: string;
  entityType: string;
  matchType: MatchType;
  matchValue: string;
  isActive: boolean;
  caseId?: string;
};

export default class RuleService {
  private response(rule: RuleDocument): RuleResponse {
    return {
      ruleId: String(rule._id),
      name: rule.name,
      entityType: rule.entityType,
      matchType: rule.matchType,
      matchValue: rule.matchValue,
      isActive: rule.isActive,
      ...(rule.caseId ? { caseId: rule.caseId } : {}),
    };
  }

  async createRule(
    payload: CreateRuleRequest,
    createdBy: string,
  ): Promise<RuleResponse> {
    const rule = await RuleModel.create({
      ...payload,
      createdBy,
      isActive: true,
    });

    return this.response(rule as unknown as RuleDocument);
  }

  async listRules(caseId?: string): Promise<RuleResponse[]> {
    const query = caseId ? { caseId } : {};
    const rules = await RuleModel.find(query);
    return rules.map((rule) => this.response(rule as unknown as RuleDocument));
  }

  async toggleRule(ruleId: string, isActive: boolean): Promise<RuleResponse> {
    const rule = await RuleModel.findByIdAndUpdate(
      ruleId,
      { isActive },
      { new: true },
    );

    if (!rule) {
      throw new NotFoundError("Rule not found");
    }

    return this.response(rule as unknown as RuleDocument);
  }
}