import assert from "node:assert/strict";
import test from "node:test";

import CrimeAnalyticsService from "./analytics.service.js";
import { parseAnalyticsFilter } from "./analytics.validation.js";

test("calculates known synthetic FIR category, district, gender, and religion aggregates", async () => {
  const syntheticCategories = [
    { _id: "synthetic theft", count: 2 },
    { _id: "synthetic fraud", count: 1 },
  ];
  const syntheticDistricts = [
    { _id: "synthetic north", count: 2 },
    { _id: "synthetic south", count: 1 },
  ];
  const syntheticGender = [
    { _id: "female", count: 4 },
    { _id: "male", count: 3 },
  ];
  const syntheticReligion = [
    { _id: "hindu", count: 4 },
    { _id: "muslim", count: 2 },
    { _id: "christian", count: 1 },
  ];

  const firModel = {
    countDocuments: async () => 3,
    aggregate: async (pipeline: unknown[]) => {
      const query = JSON.stringify(pipeline);
      if (query.includes('"$count":"total"')) return [{ total: 8 }];
      if (query.includes("$crimeCategory")) return syntheticCategories;
      if (query.includes("$district")) return syntheticDistricts;
      if (query.includes("$parties.gender")) return syntheticGender;
      if (query.includes("$parties.religion")) return syntheticReligion;
      throw new Error("Unexpected aggregate pipeline");
    },
  };
  const service = new CrimeAnalyticsService({
    firModel: firModel as unknown as never,
    getDegreeCentrality: async () => [],
    getBetweennessCentrality: async () => [],
    getLouvainCommunities: async () => [],
    getShortestPath: async () => null,
  });
  const filter = parseAnalyticsFilter({ year: "2026" });

  const [categories, districts, gender, religion] = await Promise.all([
    service.crimeCategories(filter),
    service.districts(filter),
    service.demographics("gender", "ALL", filter),
    service.demographics("religion", "ALL", filter),
  ]);

  assert.deepEqual(categories, {
    totalFirs: 3,
    buckets: [
      { value: "synthetic theft", count: 2, percentage: 66.67 },
      { value: "synthetic fraud", count: 1, percentage: 33.33 },
    ],
  });
  assert.deepEqual(districts.buckets, [
    { value: "synthetic north", count: 2, percentage: 66.67 },
    { value: "synthetic south", count: 1, percentage: 33.33 },
  ]);
  assert.deepEqual(gender.buckets, [
    { value: "female", count: 4, percentage: 57.14 },
    { value: "male", count: 3, percentage: 42.86 },
  ]);
  assert.equal(gender.totalPartyMentions, 8);
  assert.equal(gender.recordedPartyMentions, 7);
  assert.equal(gender.missingOrUnspecifiedPartyMentions, 1);
  assert.deepEqual(religion.buckets, [
    { value: "hindu", count: 4, percentage: 57.14 },
    { value: "muslim", count: 2, percentage: 28.57 },
    { value: "christian", count: 1, percentage: 14.29 },
  ]);
  assert.match(gender.usageNotice, /aggregate analytics only/i);
});
