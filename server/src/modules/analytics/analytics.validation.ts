import { BadRequestError } from "../../shared/error/globalError.js";
import { parseFirListFilter } from "../case/fir.validation.js";
import {
  PARTY_ANALYTIC_ROLES,
  type AnalyticsFilter,
  type PartyAnalyticRole,
} from "./analytics.types.js";

export const parseAnalyticsFilter = (
  query: Record<string, unknown>,
): AnalyticsFilter => {
  const { page: _page, limit: _limit, ...filter } = parseFirListFilter(query);
  void _page;
  void _limit;
  return filter;
};

export const parseAnalyticsRole = (value: unknown): PartyAnalyticRole => {
  if (value === undefined) return "ALL";
  if (typeof value !== "string" || !PARTY_ANALYTIC_ROLES.includes(value as PartyAnalyticRole)) {
    throw new BadRequestError(
      `role must be one of: ${PARTY_ANALYTIC_ROLES.join(", ")}`,
    );
  }
  return value as PartyAnalyticRole;
};

export const parseAnalyticsLimit = (value: unknown, fallback = 50): number => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new BadRequestError("limit must be an integer between 1 and 100");
  }
  const limit = Number(value);
  if (limit < 1 || limit > 100) {
    throw new BadRequestError("limit must be an integer between 1 and 100");
  }
  return limit;
};

export const requireGraphNodeId = (value: unknown, field: "from" | "to"): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError(`${field} graph node id is required`);
  }
  return value.trim();
};
