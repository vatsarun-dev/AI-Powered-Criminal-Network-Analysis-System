import type { AnalyticsFilter } from "../analytics/analytics.types.js";

export const MAP_GROUPS = ["DISTRICT", "POLICE_STATION"] as const;
export type MapGroup = (typeof MAP_GROUPS)[number];

export const DENSITY_INTERVALS = ["MONTH", "YEAR"] as const;
export type DensityInterval = (typeof DENSITY_INTERVALS)[number];

export const DENSITY_DATE_FIELDS = ["INCIDENT_DATE", "REGISTRATION_DATE"] as const;
export type DensityDateField = (typeof DENSITY_DATE_FIELDS)[number];

export type CrimeMapFilter = AnalyticsFilter & {
  groupBy: MapGroup;
  densityInterval: DensityInterval;
  dateField: DensityDateField;
};

export type MapCoordinates = {
  latitude: number;
  longitude: number;
  sourceRecordCount: number;
};

export type DensityBucket = {
  period: string;
  caseCount: number;
};

export type MapLocationSummary = {
  id: string;
  name: string;
  caseCount: number;
  geocodedCaseCount: number;
  unlocatedCaseCount: number;
  latestCaseDate?: string;
  coordinates?: MapCoordinates;
  historicalDensity: DensityBucket[];
};

export type MapFilterOptions = {
  crimeCategories: string[];
  districts: string[];
  policeStations: string[];
  statuses: string[];
  years: number[];
};

export type MapOverview = {
  groupBy: MapGroup;
  densityInterval: DensityInterval;
  dateField: DensityDateField;
  totalCases: number;
  geocodedCases: number;
  unlocatedCases: number;
  locations: MapLocationSummary[];
  filterOptions: MapFilterOptions;
  usageNotice: string;
};

export type MapLocationDetail = MapLocationSummary & {
  groupBy: MapGroup;
  crimeCategories: Array<{ value: string; count: number }>;
  statuses: Array<{ value: string; count: number }>;
  recentCases: Array<{
    id: string;
    firNumber: string;
    year: number;
    crimeCategory: string;
    status: string;
    district: string;
    policeStation: string;
    registrationDate: string;
    incidentDate?: string;
  }>;
  usageNotice: string;
};

export const MAP_USAGE_NOTICE =
  "Historical case-density visualization supports data-informed patrolling planning only. It is not individual predictive policing and does not use gender or religion for map scoring.";
