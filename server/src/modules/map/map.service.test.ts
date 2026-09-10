import assert from "node:assert/strict";
import test from "node:test";

import CrimeMapService from "./map.service.js";
import { parseCrimeMapFilter } from "./map.validation.js";

test("builds district concentration, historical density, and details from known synthetic FIR counts", async () => {
  const firModel = {
    aggregate: async (pipeline: unknown[]) => {
      const source = JSON.stringify(pipeline);
      if (source.includes('"totalCases"') && source.includes('"geocodedCases"')) {
        return [{ totalCases: 3, geocodedCases: 2 }];
      }
      if (source.includes('"geocodedCaseCount"')) {
        return [
          {
            _id: "synthetic north",
            name: "Synthetic North",
            caseCount: 2,
            geocodedCaseCount: 2,
            latestCaseDate: new Date("2026-09-09T00:00:00.000Z"),
          },
          {
            _id: "synthetic south",
            name: "Synthetic South",
            caseCount: 1,
            geocodedCaseCount: 0,
            latestCaseDate: new Date("2026-08-10T00:00:00.000Z"),
          },
        ];
      }
      if (source.includes('"sourceRecordCount"')) {
        return [{
          _id: "synthetic north",
          latitude: 13.01,
          longitude: 77.59,
          sourceRecordCount: 2,
        }];
      }
      if (source.includes('"$dateToString"')) {
        return [
          { _id: { locationId: "synthetic north", period: "2026-08" }, caseCount: 1 },
          { _id: { locationId: "synthetic north", period: "2026-09" }, caseCount: 1 },
          { _id: { locationId: "synthetic south", period: "2026-08" }, caseCount: 1 },
        ];
      }
      if (source.includes('"crimeCategories"')) {
        return [{
          crimeCategories: ["Synthetic Theft", "Synthetic Fraud"],
          districts: ["Synthetic North", "Synthetic South"],
          policeStations: ["Synthetic PS"],
          statuses: ["REGISTERED"],
          years: [2026],
        }];
      }
      if (source.includes('"$limit":25')) {
        return [{
          _id: { toString: () => "synthetic-case-1" },
          firNumber: "SYN-1",
          year: 2026,
          crimeCategory: "Synthetic Theft",
          status: "REGISTERED",
          district: "Synthetic North",
          policeStation: "Synthetic PS",
          registrationDate: new Date("2026-09-09T00:00:00.000Z"),
          incidentDate: new Date("2026-09-08T00:00:00.000Z"),
        }];
      }
      if (source.includes('"_id":"$crimeCategory"')) {
        return [{ _id: "Synthetic Theft", count: 2 }];
      }
      if (source.includes('"_id":"$status"')) {
        return [{ _id: "REGISTERED", count: 2 }];
      }
      throw new Error(`Unexpected pipeline: ${source}`);
    },
  };
  const service = new CrimeMapService({ firModel: firModel as unknown as never });
  const filter = parseCrimeMapFilter({ groupBy: "DISTRICT", densityInterval: "MONTH" });

  const overview = await service.overview(filter);
  assert.equal(overview.totalCases, 3);
  assert.equal(overview.geocodedCases, 2);
  assert.equal(overview.unlocatedCases, 1);
  assert.deepEqual(overview.locations[0], {
    id: "synthetic north",
    name: "Synthetic North",
    caseCount: 2,
    geocodedCaseCount: 2,
    unlocatedCaseCount: 0,
    latestCaseDate: "2026-09-09T00:00:00.000Z",
    coordinates: { latitude: 13.01, longitude: 77.59, sourceRecordCount: 2 },
    historicalDensity: [
      { period: "2026-08", caseCount: 1 },
      { period: "2026-09", caseCount: 1 },
    ],
  });
  assert.equal(overview.locations[1]?.coordinates, undefined);

  const details = await service.details("synthetic north", filter);
  assert.equal(details?.crimeCategories[0]?.count, 2);
  assert.equal(details?.statuses[0]?.value, "REGISTERED");
  assert.equal(details?.recentCases[0]?.id, "synthetic-case-1");
  assert.match(details?.usageNotice ?? "", /not individual predictive policing/i);
});
