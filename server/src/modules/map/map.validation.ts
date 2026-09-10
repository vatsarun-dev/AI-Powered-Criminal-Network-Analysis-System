import { BadRequestError } from "../../shared/error/globalError.js";
import { parseAnalyticsFilter } from "../analytics/analytics.validation.js";
import {
  DENSITY_DATE_FIELDS,
  DENSITY_INTERVALS,
  MAP_GROUPS,
  type CrimeMapFilter,
  type DensityDateField,
  type DensityInterval,
  type MapGroup,
} from "./map.types.js";

const parseEnum = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  fallback: T,
): T => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new BadRequestError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
};

export const parseCrimeMapFilter = (
  query: Record<string, unknown>,
): CrimeMapFilter => ({
  ...parseAnalyticsFilter(query),
  groupBy: parseEnum<MapGroup>(query.groupBy, MAP_GROUPS, "groupBy", "DISTRICT"),
  densityInterval: parseEnum<DensityInterval>(
    query.densityInterval,
    DENSITY_INTERVALS,
    "densityInterval",
    "MONTH",
  ),
  dateField: parseEnum<DensityDateField>(
    query.dateField,
    DENSITY_DATE_FIELDS,
    "dateField",
    "INCIDENT_DATE",
  ),
});

export const requireMapLocationId = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequestError("Map location id is required");
  }
  return value.trim().toLocaleLowerCase("en-IN");
};
