export type MatchType = "CONTAINS" | "EQUALS" | "REGEX";

export type Rule = {
  name: string;
  entityType: string;
  matchType: MatchType;
  matchValue: string;
  caseId?: string;
  isActive: boolean;
  createdBy: string;
};

export type CreateRuleRequest = {
  name: string;
  entityType: string;
  matchType: MatchType;
  matchValue: string;
  caseId?: string;
};

export type RuleResponse = {
  ruleId: string;
  name: string;
  entityType: string;
  matchType: MatchType;
  matchValue: string;
  isActive: boolean;
  caseId?: string;
};