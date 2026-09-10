import assert from "node:assert/strict";
import test from "node:test";

import {
  resolvePersonAgainstCandidates,
  type PersonResolutionCandidate,
} from "./entityResolution.service.js";

const syntheticFirCandidates: PersonResolutionCandidate[] = [
  {
    id: "synthetic-fir-alpha-person-rakesh",
    name: "Rakesh Kumar",
    normalizedName: "rakesh kumar",
    phones: ["+91 98765 43210"],
    deviceIds: ["IMEI-ALPHA-001"],
    accountIds: ["ACCT-ALPHA-9"],
    locationIds: ["meerut-civil-lines"],
    caseIds: ["fir-123/2026"],
    strongIdentifiers: { governmentId: "SYN-IDENTITY-001" },
    sourceEntityIds: ["synthetic-fir-alpha-page-1-person"],
  },
  {
    id: "synthetic-fir-beta-person-rakesh",
    name: "Rakesh Kumar",
    normalizedName: "rakesh kumar",
    phones: ["+91 91234 56789"],
    locationIds: ["lucknow-hazratganj"],
    caseIds: ["fir-456/2026"],
    sourceEntityIds: ["synthetic-fir-beta-page-2-person"],
  },
  {
    id: "synthetic-fir-gamma-person-rahul",
    name: "Rahul Verma",
    normalizedName: "rahul verma",
    locationIds: ["meerut-civil-lines"],
    sourceEntityIds: ["synthetic-fir-gamma-page-1-person"],
  },
];

test("matches an exact stable identifier and preserves source entity IDs", () => {
  const result = resolvePersonAgainstCandidates(
    {
      personId: "synthetic-fir-alpha-person-rakesh",
      sourceEntityIds: ["synthetic-fir-new-page-3-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "MATCHED");
  assert.equal(result.confidence, 1);
  assert.deepEqual(result.matchedSignals.map((signal) => signal.type), [
    "EXACT_STABLE_IDENTIFIER",
  ]);
  assert.deepEqual(
    result.sourceEntityIds.sort(),
    [
      "synthetic-fir-alpha-page-1-person",
      "synthetic-fir-alpha-person-rakesh",
      "synthetic-fir-new-page-3-person",
    ].sort(),
  );
});

test("prioritizes an exact stable identifier over a conflicting phone candidate", () => {
  const result = resolvePersonAgainstCandidates(
    {
      personId: "synthetic-fir-beta-person-rakesh",
      phone: "98765-43210",
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "MATCHED");
  assert.equal(result.candidate?.entityId, "synthetic-fir-beta-person-rakesh");
  assert.ok(
    result.matchedSignals.some(
      (signal) => signal.type === "EXACT_STABLE_IDENTIFIER",
    ),
  );
});

test("matches a normalized Indian phone representation", () => {
  const result = resolvePersonAgainstCandidates(
    {
      phone: "98765-43210",
      sourceEntityIds: ["synthetic-fir-new-page-1-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "MATCHED");
  assert.equal(result.confidence, 0.98);
  assert.equal(result.candidate?.entityId, "synthetic-fir-alpha-person-rakesh");
  assert.ok(
    result.matchedSignals.some(
      (signal) => signal.type === "EXACT_NORMALIZED_PHONE",
    ),
  );
});

test("matches an exact strong identifier from a fictional FIR", () => {
  const result = resolvePersonAgainstCandidates(
    {
      strongIdentifiers: { government_id: "syn-identity-001" },
      sourceEntityIds: ["synthetic-fir-new-page-2-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "MATCHED");
  assert.equal(result.candidate?.entityId, "synthetic-fir-alpha-person-rakesh");
  assert.ok(
    result.matchedSignals.some(
      (signal) => signal.type === "EXACT_STRONG_IDENTIFIER",
    ),
  );
});

test("matches a fuzzy name only when a supporting location corroborates it", () => {
  const result = resolvePersonAgainstCandidates(
    {
      name: "Rakesh Kumaar",
      locationId: "meerut-civil-lines",
      sourceEntityIds: ["synthetic-fir-new-page-4-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "MATCHED");
  assert.ok(
    result.matchedSignals.some((signal) => signal.type === "FUZZY_NAME"));
  assert.ok(
    result.matchedSignals.some((signal) => signal.type === "SHARED_LOCATION"));
});

test("never automatically matches name-only similarity", () => {
  const result = resolvePersonAgainstCandidates(
    {
      name: "Rakesh Kumaar",
      sourceEntityIds: ["synthetic-fir-new-page-5-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "POSSIBLE_MATCH");
  assert.match(result.explanation, /never sufficient/i);
});

test("uses phonetic similarity only as a review candidate", () => {
  const result = resolvePersonAgainstCandidates(
    {
      name: "Raahul Varma",
      sourceEntityIds: ["synthetic-fir-new-page-6-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "POSSIBLE_MATCH");
  assert.ok(
    result.matchedSignals.some((signal) => signal.type === "PHONETIC_NAME"));
});

test("returns no match when synthetic FIR evidence shares no identity signal", () => {
  const result = resolvePersonAgainstCandidates(
    {
      name: "Meera Singh",
      phone: "99887-76655",
      sourceEntityIds: ["synthetic-fir-new-page-7-person"],
    },
    syntheticFirCandidates,
  );

  assert.equal(result.status, "NO_MATCH");
  assert.equal(result.confidence, 0);
  assert.deepEqual(result.candidates, []);
});

test("does not choose a person automatically when an exact phone is ambiguous", () => {
  const duplicatedPhoneCandidates: PersonResolutionCandidate[] = [
    syntheticFirCandidates[0] as PersonResolutionCandidate,
    {
      id: "synthetic-fir-delta-person-shared-phone",
      name: "Rakesh Sharma",
      phones: ["+91 98765 43210"],
      sourceEntityIds: ["synthetic-fir-delta-page-1-person"],
    },
  ];

  const result = resolvePersonAgainstCandidates(
    { phone: "+91 98765 43210" },
    duplicatedPhoneCandidates,
  );

  assert.equal(result.status, "POSSIBLE_MATCH");
  assert.match(result.explanation, /multiple candidates/i);
});

test("uses a corroborating fuzzy name to disambiguate a shared exact phone", () => {
  const duplicatedPhoneCandidates: PersonResolutionCandidate[] = [
    syntheticFirCandidates[0] as PersonResolutionCandidate,
    {
      id: "synthetic-fir-delta-person-shared-phone",
      name: "Rakesh Sharma",
      phones: ["+91 98765 43210"],
      sourceEntityIds: ["synthetic-fir-delta-page-1-person"],
    },
  ];

  const result = resolvePersonAgainstCandidates(
    { name: "Rakesh Kumaar", phone: "98765-43210" },
    duplicatedPhoneCandidates,
  );

  assert.equal(result.status, "MATCHED");
  assert.equal(result.candidate?.entityId, "synthetic-fir-alpha-person-rakesh");
});
