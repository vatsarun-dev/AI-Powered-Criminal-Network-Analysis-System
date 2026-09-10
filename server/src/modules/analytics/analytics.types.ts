import type { FirListFilter } from "../case/fir.types.js";

export type AnalyticsFilter = Omit<FirListFilter, "page" | "limit">;

export type CountBucket = {
  value: string;
  count: number;
  percentage: number;
};

export type FirDimensionAnalytics = {
  totalFirs: number;
  buckets: CountBucket[];
};

export const ANALYTICS_USAGE_NOTICE =
  "Descriptive aggregate analytics only. Do not use gender or religion data for individual risk prediction, criminal profiling, or decisions about a person.";

export const PARTY_ANALYTIC_ROLES = [
  "ALL",
  "COMPLAINANT",
  "VICTIM",
  "ACCUSED",
] as const;

export type PartyAnalyticRole = (typeof PARTY_ANALYTIC_ROLES)[number];

export type DemographicAnalytics = {
  attribute: "gender" | "religion";
  role: PartyAnalyticRole;
  totalPartyMentions: number;
  recordedPartyMentions: number;
  missingOrUnspecifiedPartyMentions: number;
  buckets: CountBucket[];
  usageNotice: typeof ANALYTICS_USAGE_NOTICE;
};
