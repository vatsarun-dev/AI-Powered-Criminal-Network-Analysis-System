import { FirModel } from "../../models/fir.model.js";
import {
  getBetweennessCentrality,
  getDegreeCentrality,
  getLouvainCommunities,
} from "../../graph/graphAnalytics.service.js";
import { getShortestPath } from "../../graph/graphQuery.service.js";
import { buildFirMongoFilter } from "../case/fir.service.js";
import type { FirListFilter } from "../case/fir.types.js";
import {
  ANALYTICS_USAGE_NOTICE,
  type AnalyticsFilter,
  type CountBucket,
  type DemographicAnalytics,
  type FirDimensionAnalytics,
  type PartyAnalyticRole,
} from "./analytics.types.js";

type AggregateCountRow = { _id: string; count: number };
type AggregateTotalRow = { total: number };

const asMongoMatch = (filter: AnalyticsFilter): Record<string, unknown> => {
  const listFilter: FirListFilter = { ...filter, page: 1, limit: 1 };
  return buildFirMongoFilter(listFilter) as Record<string, unknown>;
};

const numberValue = (value: unknown): number =>
  typeof value === "number" ? value : Number(value);

const toBuckets = (
  rows: AggregateCountRow[],
  total: number,
): CountBucket[] =>
  rows.map((row) => ({
    value: row._id,
    count: numberValue(row.count),
    percentage: total === 0 ? 0 : Number(((numberValue(row.count) / total) * 100).toFixed(2)),
  }));

const normalizedFieldExpression = (field: string) => ({
  $toLower: {
    $trim: {
      input: { $ifNull: [field, ""] },
    },
  },
});

const partyPipeline = (
  match: Record<string, unknown>,
  role: PartyAnalyticRole,
) => [
  { $match: match },
  {
    $project: {
      parties: {
        $concatArrays: [
          [{ $mergeObjects: ["$complainant", { role: "COMPLAINANT" }] }],
          {
            $map: {
              input: { $ifNull: ["$victims", []] },
              as: "party",
              in: { $mergeObjects: ["$$party", { role: "VICTIM" }] },
            },
          },
          {
            $map: {
              input: { $ifNull: ["$accused", []] },
              as: "party",
              in: { $mergeObjects: ["$$party", { role: "ACCUSED" }] },
            },
          },
        ],
      },
    },
  },
  { $unwind: "$parties" },
  ...(role === "ALL" ? [] : [{ $match: { "parties.role": role } }]),
];

export type CrimeAnalyticsDependencies = {
  firModel?: typeof FirModel;
  getDegreeCentrality?: typeof getDegreeCentrality;
  getBetweennessCentrality?: typeof getBetweennessCentrality;
  getLouvainCommunities?: typeof getLouvainCommunities;
  getShortestPath?: typeof getShortestPath;
};

export default class CrimeAnalyticsService {
  private readonly firModel: typeof FirModel;
  private readonly degreeCentrality: typeof getDegreeCentrality;
  private readonly betweennessCentrality: typeof getBetweennessCentrality;
  private readonly louvainCommunities: typeof getLouvainCommunities;
  private readonly shortestPath: typeof getShortestPath;

  constructor(dependencies: CrimeAnalyticsDependencies = {}) {
    this.firModel = dependencies.firModel ?? FirModel;
    this.degreeCentrality = dependencies.getDegreeCentrality ?? getDegreeCentrality;
    this.betweennessCentrality =
      dependencies.getBetweennessCentrality ?? getBetweennessCentrality;
    this.louvainCommunities =
      dependencies.getLouvainCommunities ?? getLouvainCommunities;
    this.shortestPath = dependencies.getShortestPath ?? getShortestPath;
  }

  private async firDimension(
    field: "$crimeCategory" | "$district",
    filter: AnalyticsFilter,
  ): Promise<FirDimensionAnalytics> {
    const match = asMongoMatch(filter);
    const [total, rows] = await Promise.all([
      this.firModel.countDocuments(match as never),
      this.firModel.aggregate<AggregateCountRow>([
        { $match: match },
        { $project: { dimension: normalizedFieldExpression(field) } },
        { $match: { dimension: { $ne: "" } } },
        { $group: { _id: "$dimension", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
    ]);

    return {
      totalFirs: total,
      buckets: toBuckets(rows, total),
    };
  }

  async crimeCategories(filter: AnalyticsFilter): Promise<FirDimensionAnalytics> {
    return this.firDimension("$crimeCategory", filter);
  }

  async districts(filter: AnalyticsFilter): Promise<FirDimensionAnalytics> {
    return this.firDimension("$district", filter);
  }

  async demographics(
    attribute: "gender" | "religion",
    role: PartyAnalyticRole,
    filter: AnalyticsFilter,
  ): Promise<DemographicAnalytics> {
    const match = asMongoMatch(filter);
    const base = partyPipeline(match, role);
    const [totalRows, rows] = await Promise.all([
      this.firModel.aggregate<AggregateTotalRow>([
        ...base,
        { $count: "total" },
      ]),
      this.firModel.aggregate<AggregateCountRow>([
        ...base,
        { $project: { value: normalizedFieldExpression(`$parties.${attribute}`) } },
        { $match: { value: { $ne: "" } } },
        { $group: { _id: "$value", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
      ]),
    ]);
    const totalPartyMentions = numberValue(totalRows[0]?.total ?? 0);
    const recordedPartyMentions = rows.reduce(
      (total, row) => total + numberValue(row.count),
      0,
    );

    return {
      attribute,
      role,
      totalPartyMentions,
      recordedPartyMentions,
      missingOrUnspecifiedPartyMentions: totalPartyMentions - recordedPartyMentions,
      buckets: toBuckets(rows, recordedPartyMentions),
      usageNotice: ANALYTICS_USAGE_NOTICE,
    };
  }

  async graphDegree(limit: number) {
    return this.degreeCentrality(limit);
  }

  async graphBetweenness(limit: number) {
    return this.betweennessCentrality(limit);
  }

  async graphCommunities() {
    return this.louvainCommunities();
  }

  async graphShortestPath(from: string, to: string) {
    return this.shortestPath(from, to);
  }
}
