import { RuleModel } from "../models/rule.model.js";
import { AlertModel } from "../models/alert.model.js";
import type { Rule } from "../types/rule.js";

type MatchableEntity = {
  _id: string;
  entityType: string;
  normalizedValue: string;
  caseId?: string;
};

function isMatch(rule: Rule, entity: MatchableEntity): boolean {
  if (rule.entityType !== entity.entityType) {
    return false;
  }

  if (rule.caseId && entity.caseId && rule.caseId !== entity.caseId) {
    return false;
  }

  switch (rule.matchType) {
    case "EQUALS":
      return entity.normalizedValue === rule.matchValue;

    case "CONTAINS":
      return entity.normalizedValue
        .toLowerCase()
        .includes(rule.matchValue.toLowerCase());

    case "REGEX":
      try {
        const regex = new RegExp(rule.matchValue, "i");
        return regex.test(entity.normalizedValue);
      } catch {
        // invalid regex on the rule — skip rather than crash
        return false;
      }

    default:
      return false;
  }
}

/**
 * Checks a newly saved entity against all active rules.
 * Creates an Alert record for every rule that matches.
 * Call this after an entity has been saved (and ideally after
 * it has been linked to its case, if caseId is available).
 */
export async function evaluateEntityAgainstRules(
  entity: MatchableEntity,
): Promise<void> {
  const activeRules = await RuleModel.find({ isActive: true });

  for (const rule of activeRules) {
    if (isMatch(rule, entity)) {
      await AlertModel.create({
         ruleId: String(rule._id),
         entityId: entity._id,
         caseId: entity.caseId ?? rule.caseId ?? "UNKNOWN",
         message: `Rule "${rule.name}" matched entity value "${entity.normalizedValue}"`,
         status: "NEW",
         triggeredAt: new Date(),
      });
    }
  }
}