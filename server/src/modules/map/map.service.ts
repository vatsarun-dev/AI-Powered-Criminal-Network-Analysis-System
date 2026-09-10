import { FirModel } from "../../models/fir.model.js";
import { buildFirMongoFilter } from "../case/fir.service.js";
import type { FirListFilter } from "../case/fir.types.js";
import {
  MAP_USAGE_NOTICE,
  type CrimeMapFilter,
  type DensityBucket,
  type MapCoordinates,
  type MapFilterOptions,
  type MapGroup,
  type MapLocationDetail,
  type MapLocationSummary,
  type MapOverview,
} from "./map.types.js";

type GroupCountRow = {
  _id: string;
  name: string;
  caseCount: number;
  geocodedCaseCount: number;
  latestCaseDate?: Date;
};

type CoordinateRow = {
  _id: string;
  latitude: number;
  longitude: number;
  sourceRecordCount: number;
};

type DensityRow = { _id: { locationId: string; period: string }; caseCount: number };
type CountRow = { _id: string; count: number };
type TotalRow = { totalCases: number; geocodedCases: number };
type OptionsRow = {
  crimeCategories: string[];
  districts: string[];
  policeStations: string[];
  statuses: string[];
  years: number[];
};

const normalisedValue = (field: string) => ({
  $toLower: { $trim: { input: { $ifNull: [field, ""] } } },
});

const dimensionsFor = (groupBy: MapGroup) =>
  groupBy === "DISTRICT"
    ? { name: "$district", id: normalisedValue("$district"), coordinates: "$districtCoordinates" }
    : {
        name: "$policeStation",
        id: normalisedValue("$policeStation"),
        coordinates: "$policeStationCoordinates",
      };

const isCoordinate = (coordinatesField: string) => ({
  $and: [
    { $isNumber: `${coordinatesField}.latitude` },
    { $isNumber: `${coordinatesField}.longitude` },
  ],
});

const mapMatch = (filter: CrimeMapFilter): Record<string, unknown> => {
  const listFilter: FirListFilter = { ...filter, page: 1, limit: 1 };
  return buildFirMongoFilter(listFilter) as Record<string, unknown>;
};

const dateExpression = (filter: CrimeMapFilter) =>
  filter.dateField === "REGISTRATION_DATE"
    ? "$registrationDate"
    : { $ifNull: ["$incidentDate", "$registrationDate"] };

const periodFormat = (filter: CrimeMapFilter) =>
  filter.densityInterval === "MONTH" ? "%Y-%m" : "%Y";

const toNumber = (value: unknown): number =>
  typeof value === "number" ? value : Number(value);

const safeArray = <T>(value: T[] | undefined): T[] => value ?? [];

export type CrimeMapDependencies = { firModel?: typeof FirModel };

export default class CrimeMapService {
  private readonly firModel: typeof FirModel;

  constructor(dependencies: CrimeMapDependencies = {}) {
    this.firModel = dependencies.firModel ?? FirModel;
  }

  private baseProjection(filter: CrimeMapFilter) {
    const dimensions = dimensionsFor(filter.groupBy);
    return {
      locationId: dimensions.id,
      locationName: dimensions.name,
      coordinates: dimensions.coordinates,
      caseDate: dateExpression(filter),
      crimeCategory: "$crimeCategory",
      status: "$status",
      firNumber: "$firNumber",
      year: "$year",
      district: "$district",
      policeStation: "$policeStation",
      registrationDate: "$registrationDate",
      incidentDate: "$incidentDate",
    };
  }

  private async mapLocations(filter: CrimeMapFilter): Promise<{
    totals: TotalRow;
    locations: MapLocationSummary[];
  }> {
    const match = mapMatch(filter);
    const projection = this.baseProjection(filter);
    const coordinateCondition = isCoordinate("$coordinates");
    const sourceCoordinateCondition = isCoordinate(
      filter.groupBy === "DISTRICT"
        ? "$districtCoordinates"
        : "$policeStationCoordinates",
    );
    const [totalsRows, groups, coordinates, densityRows] = await Promise.all([
      this.firModel.aggregate<TotalRow>([
        { $match: match },
        {
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            geocodedCases: { $sum: { $cond: [sourceCoordinateCondition, 1, 0] } },
          },
        },
      ]),
      this.firModel.aggregate<GroupCountRow>([
        { $match: match },
        { $project: projection },
        { $match: { locationId: { $ne: "" } } },
        {
          $group: {
            _id: "$locationId",
            name: { $first: "$locationName" },
            caseCount: { $sum: 1 },
            geocodedCaseCount: { $sum: { $cond: [coordinateCondition, 1, 0] } },
            latestCaseDate: { $max: "$caseDate" },
          },
        },
        { $sort: { caseCount: -1, name: 1 } },
      ]),
      this.firModel.aggregate<CoordinateRow>([
        { $match: match },
        { $project: projection },
        { $match: { locationId: { $ne: "" }, $expr: coordinateCondition } },
        {
          $group: {
            _id: {
              locationId: "$locationId",
              latitude: "$coordinates.latitude",
              longitude: "$coordinates.longitude",
            },
            sourceRecordCount: { $sum: 1 },
          },
        },
        { $sort: { sourceRecordCount: -1, "_id.locationId": 1 } },
        {
          $group: {
            _id: "$_id.locationId",
            latitude: { $first: "$_id.latitude" },
            longitude: { $first: "$_id.longitude" },
            sourceRecordCount: { $first: "$sourceRecordCount" },
          },
        },
      ]),
      this.firModel.aggregate<DensityRow>([
        { $match: match },
        { $project: projection },
        { $match: { locationId: { $ne: "" }, caseDate: { $ne: null } } },
        {
          $group: {
            _id: {
              locationId: "$locationId",
              period: { $dateToString: { format: periodFormat(filter), date: "$caseDate" } },
            },
            caseCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.period": 1 } },
      ]),
    ]);

    const coordinateById = new Map<string, MapCoordinates>(
      coordinates.map((row) => [
        row._id,
        {
          latitude: toNumber(row.latitude),
          longitude: toNumber(row.longitude),
          sourceRecordCount: toNumber(row.sourceRecordCount),
        },
      ]),
    );
    const densityById = new Map<string, DensityBucket[]>();
    for (const row of densityRows) {
      const locationId = row._id.locationId;
      const buckets = densityById.get(locationId) ?? [];
      buckets.push({ period: row._id.period, caseCount: toNumber(row.caseCount) });
      densityById.set(locationId, buckets);
    }

    const locations = groups.map((row) => {
      const coordinatesForLocation = coordinateById.get(row._id);
      return {
        id: row._id,
        name: row.name,
        caseCount: toNumber(row.caseCount),
        geocodedCaseCount: toNumber(row.geocodedCaseCount),
        unlocatedCaseCount: toNumber(row.caseCount) - toNumber(row.geocodedCaseCount),
        ...(row.latestCaseDate ? { latestCaseDate: row.latestCaseDate.toISOString() } : {}),
        ...(coordinatesForLocation ? { coordinates: coordinatesForLocation } : {}),
        historicalDensity: densityById.get(row._id) ?? [],
      } satisfies MapLocationSummary;
    });

    return {
      totals: totalsRows[0] ?? { totalCases: 0, geocodedCases: 0 },
      locations,
    };
  }

  private async options(filter: CrimeMapFilter): Promise<MapFilterOptions> {
    const match = mapMatch(filter);
    const rows = await this.firModel.aggregate<OptionsRow>([
      { $match: match },
      {
        $group: {
          _id: null,
          crimeCategories: { $addToSet: "$crimeCategory" },
          districts: { $addToSet: "$district" },
          policeStations: { $addToSet: "$policeStation" },
          statuses: { $addToSet: "$status" },
          years: { $addToSet: "$year" },
        },
      },
    ]);
    const row = rows[0];
    return {
      crimeCategories: safeArray(row?.crimeCategories).sort((a, b) => a.localeCompare(b)),
      districts: safeArray(row?.districts).sort((a, b) => a.localeCompare(b)),
      policeStations: safeArray(row?.policeStations).sort((a, b) => a.localeCompare(b)),
      statuses: safeArray(row?.statuses).sort((a, b) => a.localeCompare(b)),
      years: safeArray(row?.years).sort((a, b) => b - a),
    };
  }

  async overview(filter: CrimeMapFilter): Promise<MapOverview> {
    const [{ totals, locations }, filterOptions] = await Promise.all([
      this.mapLocations(filter),
      this.options(filter),
    ]);
    const totalCases = toNumber(totals.totalCases);
    const geocodedCases = toNumber(totals.geocodedCases);
    return {
      groupBy: filter.groupBy,
      densityInterval: filter.densityInterval,
      dateField: filter.dateField,
      totalCases,
      geocodedCases,
      unlocatedCases: totalCases - geocodedCases,
      locations,
      filterOptions,
      usageNotice: MAP_USAGE_NOTICE,
    };
  }

  async details(locationId: string, filter: CrimeMapFilter): Promise<MapLocationDetail | null> {
    const { locations } = await this.mapLocations(filter);
    const location = locations.find((item) => item.id === locationId);
    if (!location) return null;

    const match = mapMatch(filter);
    const projection = this.baseProjection(filter);
    const scopedPipeline = [
      { $match: match },
      { $project: projection },
      { $match: { locationId } },
    ];
    const [categories, statuses, recentCases] = await Promise.all([
      this.firModel.aggregate<CountRow>([
        ...scopedPipeline,
        { $group: { _id: "$crimeCategory", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      this.firModel.aggregate<CountRow>([
        ...scopedPipeline,
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
      this.firModel.aggregate<{
        _id: { toString(): string };
        firNumber: string;
        year: number;
        crimeCategory: string;
        status: string;
        district: string;
        policeStation: string;
        registrationDate: Date;
        incidentDate?: Date;
      }>([
        ...scopedPipeline,
        { $sort: { caseDate: -1, registrationDate: -1 } },
        { $limit: 25 },
      ]),
    ]);

    return {
      ...location,
      groupBy: filter.groupBy,
      crimeCategories: categories.map((item) => ({ value: item._id, count: toNumber(item.count) })),
      statuses: statuses.map((item) => ({ value: item._id, count: toNumber(item.count) })),
      recentCases: recentCases.map((item) => ({
        id: item._id.toString(),
        firNumber: item.firNumber,
        year: item.year,
        crimeCategory: item.crimeCategory,
        status: item.status,
        district: item.district,
        policeStation: item.policeStation,
        registrationDate: item.registrationDate.toISOString(),
        ...(item.incidentDate ? { incidentDate: item.incidentDate.toISOString() } : {}),
      })),
      usageNotice: MAP_USAGE_NOTICE,
    };
  }
}
