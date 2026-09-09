import * as fuzzball from "fuzzball";

import { neo4jDriver, neo4jDatabase } from "../config/neo4j.js";
import { normalizeEntityValue } from "../service/entity-normalization.service.js";

export const RESOLUTION_STATUSES = [
  "MATCHED",
  "POSSIBLE_MATCH",
  "NO_MATCH",
] as const;

export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];

type SignalType =
  | "EXACT_STABLE_IDENTIFIER"
  | "EXACT_NORMALIZED_PHONE"
  | "EXACT_STRONG_IDENTIFIER"
  | "FUZZY_NAME"
  | "PHONETIC_NAME"
  | "SHARED_LOCATION"
  | "SHARED_CASE";

export type MatchedSignal = {
  type: SignalType;
  description: string;
};

/**
 * The source entity IDs identify the original Mongo evidence records. They
 * are carried through a decision rather than replacing those records with a
 * canonical record at this stage.
 */
export type EntityResolutionRequest = {
  sourceEntityIds?: string[];
  personId?: string;
  name?: string;
  phone?: string;
  deviceId?: string;
  accountId?: string;
  locationId?: string;
  caseId?: string;
  strongIdentifiers?: Record<string, string>;
};

export type PersonResolutionCandidate = {
  id: string;
  name?: string;
  normalizedName?: string;
  phones?: string[];
  deviceIds?: string[];
  accountIds?: string[];
  locationIds?: string[];
  caseIds?: string[];
  strongIdentifiers?: Record<string, string>;
  sourceEntityIds?: string[];
};

export type ResolutionCandidate = {
  entityId: string;
  name?: string;
  sourceEntityIds: string[];
  confidence: number;
  matchedSignals: MatchedSignal[];
};

export type EntityResolutionResult = {
  status: ResolutionStatus;
  confidence: number;
  matchedSignals: MatchedSignal[];
  explanation: string;
  sourceEntityIds: string[];
  candidate?: ResolutionCandidate;
  candidates: ResolutionCandidate[];
};

type NormalizedResolutionRequest = {
  sourceEntityIds: string[];
  personId?: string;
  name?: string;
  normalizedName?: string;
  phone?: string;
  deviceId?: string;
  accountId?: string;
  locationId?: string;
  caseId?: string;
  strongIdentifiers: Record<string, string>;
};

type CandidateEvaluation = {
  candidate: PersonResolutionCandidate;
  confidence: number;
  matchedSignals: MatchedSignal[];
  hasDecisiveSignal: boolean;
  primarySignalPriority: number;
  hasSupportingSignal: boolean;
  nameSimilarity: number;
  phoneticMatch: boolean;
};

const FUZZY_NAME_THRESHOLD = 0.78;
const AUTO_MATCH_NAME_THRESHOLD = 0.8;
const unique = (values: string[]): string[] => [...new Set(values)];

const normalizeToken = (value: string): string =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en-IN");

const normalizeIdentifierKey = (value: string): string =>
  value
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLocaleLowerCase("en-IN");

const normalizeIdentifierValue = (value: string): string =>
  normalizeToken(value).replace(/[\s-]/g, "");

const normalizeStringArray = (
  values: string[] | undefined,
  normalizer: (value: string) => string = normalizeToken,
): string[] =>
  unique(
    (values ?? [])
      .map((value) => normalizer(value))
      .filter((value) => value.length > 0),
  );

const soundex = (value: string): string => {
  const letters = value.toLocaleUpperCase("en-IN").replace(/[^A-Z]/g, "");
  if (!letters) {
    return "";
  }

  const groups: Record<string, string> = {
    B: "1", F: "1", P: "1", V: "1",
    C: "2", G: "2", J: "2", K: "2", Q: "2", S: "2", X: "2", Z: "2",
    D: "3", T: "3", L: "4", M: "5", N: "5", R: "6",
  };

  const first = letters[0] ?? "";
  let previous = groups[first] ?? "";
  let encoded = "";

  for (const letter of letters.slice(1)) {
    const code = groups[letter] ?? "";
    if (code && code !== previous) {
      encoded += code;
    }
    previous = code;
  }

  return `${first}${encoded}000`.slice(0, 4);
};

/** Soundex only generates candidates; it can never cause an automatic merge. */
const namesArePhoneticallySimilar = (
  left: string | undefined,
  right: string | undefined,
): boolean => {
  if (!left || !right) {
    return false;
  }

  const leftTokens = normalizeToken(left).split(" ").filter(Boolean);
  const rightTokens = normalizeToken(right).split(" ").filter(Boolean);

  if (leftTokens.length !== rightTokens.length || leftTokens.length === 0) {
    return false;
  }

  return leftTokens.every(
    (token, index) => soundex(token) === soundex(rightTokens[index] ?? ""),
  );
};

const clampConfidence = (value: number): number =>
  Math.round(Math.min(1, Math.max(0, value)) * 100) / 100;

const normaliseRequest = (
  request: EntityResolutionRequest,
): NormalizedResolutionRequest => {
  const strongIdentifiers = Object.fromEntries(
    Object.entries(request.strongIdentifiers ?? {})
      .map(
        ([key, value]) =>
          [normalizeIdentifierKey(key), normalizeIdentifierValue(value)] as const,
      )
      .filter(([key, value]) => key.length > 0 && value.length > 0),
  );

  const normalizedName = request.name
    ? normalizeEntityValue(request.name, "PERSON")
    : "";
  const normalizedPhone = request.phone
    ? normalizeEntityValue(request.phone, "PHONE")
    : "";

  return {
    sourceEntityIds: unique(
      [
        ...(request.sourceEntityIds ?? []),
        ...(request.personId ? [request.personId] : []),
      ].map((value) => value.trim()).filter(Boolean),
    ),
    ...(request.personId ? { personId: request.personId.trim() } : {}),
    ...(request.name ? { name: request.name.trim() } : {}),
    ...(normalizedName ? { normalizedName } : {}),
    ...(normalizedPhone ? { phone: normalizedPhone } : {}),
    ...(request.deviceId ? { deviceId: normalizeToken(request.deviceId) } : {}),
    ...(request.accountId ? { accountId: normalizeToken(request.accountId) } : {}),
    ...(request.locationId ? { locationId: normalizeToken(request.locationId) } : {}),
    ...(request.caseId ? { caseId: normalizeToken(request.caseId) } : {}),
    strongIdentifiers,
  };
};

export const hasResolutionSignal = (
  request: EntityResolutionRequest,
): boolean => {
  const normalized = normaliseRequest(request);

  return Boolean(
    normalized.personId ||
      normalized.normalizedName ||
      normalized.phone ||
      normalized.deviceId ||
      normalized.accountId ||
      normalized.locationId ||
      normalized.caseId ||
      Object.keys(normalized.strongIdentifiers).length,
  );
};

const buildCandidateSummary = (
  candidate: PersonResolutionCandidate,
  confidence: number,
  matchedSignals: MatchedSignal[],
): ResolutionCandidate => ({
  entityId: candidate.id,
  ...(candidate.name ? { name: candidate.name } : {}),
  sourceEntityIds: unique([candidate.id, ...(candidate.sourceEntityIds ?? [])]),
  confidence: clampConfidence(confidence),
  matchedSignals,
});

const matchesAny = (value: string | undefined, candidates: string[]): boolean =>
  Boolean(value && candidates.includes(value));

const evaluateCandidate = (
  request: NormalizedResolutionRequest,
  candidate: PersonResolutionCandidate,
): CandidateEvaluation => {
  const signals: MatchedSignal[] = [];
  let confidence = 0;
  let hasDecisiveSignal = false;
  let primarySignalPriority = 0;
  let hasSupportingSignal = false;

  const candidateSourceIds = unique([candidate.id, ...(candidate.sourceEntityIds ?? [])]);
  if (request.personId && candidateSourceIds.includes(request.personId)) {
    signals.push({
      type: "EXACT_STABLE_IDENTIFIER",
      description: "Exact stable person/source entity identifier.",
    });
    confidence = 1;
    hasDecisiveSignal = true;
    primarySignalPriority = 3;
  }

  const candidatePhones = normalizeStringArray(
    candidate.phones,
    (value) => normalizeEntityValue(value, "PHONE"),
  );
  if (matchesAny(request.phone, candidatePhones)) {
    signals.push({
      type: "EXACT_NORMALIZED_PHONE",
      description: "Exact match after Indian phone normalization.",
    });
    confidence = Math.max(confidence, 0.98);
    hasDecisiveSignal = true;
    primarySignalPriority = Math.max(primarySignalPriority, 2);
  }

  const candidateDevices = normalizeStringArray(candidate.deviceIds);
  const candidateAccounts = normalizeStringArray(candidate.accountIds);
  if (matchesAny(request.deviceId, candidateDevices)) {
    signals.push({
      type: "EXACT_STRONG_IDENTIFIER",
      description: "Exact shared device identifier.",
    });
    confidence = Math.max(confidence, 0.97);
    hasDecisiveSignal = true;
    primarySignalPriority = Math.max(primarySignalPriority, 1);
  }
  if (matchesAny(request.accountId, candidateAccounts)) {
    signals.push({
      type: "EXACT_STRONG_IDENTIFIER",
      description: "Exact shared account identifier.",
    });
    confidence = Math.max(confidence, 0.97);
    hasDecisiveSignal = true;
    primarySignalPriority = Math.max(primarySignalPriority, 1);
  }

  const candidateStrongIdentifiers = Object.fromEntries(
    Object.entries(candidate.strongIdentifiers ?? {}).map(([key, value]) => [
      normalizeIdentifierKey(key),
      normalizeIdentifierValue(value),
    ]),
  );
  const strongIdentifierMatches = Object.keys(request.strongIdentifiers).filter(
    (key) => candidateStrongIdentifiers[key] === request.strongIdentifiers[key],
  );
  for (const key of strongIdentifierMatches) {
    signals.push({
      type: "EXACT_STRONG_IDENTIFIER",
      description: `Exact ${key.replace(/_/g, " ")} identifier.`,
    });
  }
  if (strongIdentifierMatches.length > 0) {
    confidence = Math.max(
      confidence,
      0.97 + Math.min(0.02, (strongIdentifierMatches.length - 1) * 0.01),
    );
    hasDecisiveSignal = true;
    primarySignalPriority = Math.max(primarySignalPriority, 1);
  }

  const candidateName =
    candidate.normalizedName ??
    (candidate.name ? normalizeEntityValue(candidate.name, "PERSON") : "");
  const nameSimilarity =
    request.normalizedName && candidateName
      ? Math.max(
          fuzzball.ratio(request.normalizedName, candidateName),
          fuzzball.token_sort_ratio(request.normalizedName, candidateName),
        ) / 100
      : 0;
  const phoneticMatch = namesArePhoneticallySimilar(request.name, candidate.name);

  if (nameSimilarity >= FUZZY_NAME_THRESHOLD) {
    signals.push({
      type: "FUZZY_NAME",
      description: `Fuzzy normalized-name similarity: ${Math.round(nameSimilarity * 100)}%.`,
    });
    confidence = Math.max(confidence, 0.55 + nameSimilarity * 0.2);
  }
  if (phoneticMatch) {
    signals.push({
      type: "PHONETIC_NAME",
      description: "Equivalent token-level phonetic encoding; treated as a candidate signal only.",
    });
    confidence = Math.max(confidence, 0.62);
  }

  const candidateLocations = normalizeStringArray(candidate.locationIds);
  if (matchesAny(request.locationId, candidateLocations)) {
    signals.push({ type: "SHARED_LOCATION", description: "Shared location identifier." });
    hasSupportingSignal = true;
  }
  const candidateCases = normalizeStringArray(candidate.caseIds);
  if (matchesAny(request.caseId, candidateCases)) {
    signals.push({ type: "SHARED_CASE", description: "Shared case identifier." });
    hasSupportingSignal = true;
  }
  if (hasSupportingSignal && nameSimilarity >= FUZZY_NAME_THRESHOLD) {
    confidence = Math.max(confidence, 0.75 + nameSimilarity * 0.15);
  } else if (hasSupportingSignal && phoneticMatch) {
    confidence = Math.max(confidence, 0.76);
  }

  // Auxiliary evidence can distinguish candidates that otherwise share a
  // phone or another exact identifier, but it never outranks a stable ID.
  if (
    hasDecisiveSignal &&
    primarySignalPriority < 3 &&
    nameSimilarity >= FUZZY_NAME_THRESHOLD
  ) {
    confidence = Math.max(confidence, 0.99);
  }
  if (hasDecisiveSignal && primarySignalPriority < 3 && hasSupportingSignal) {
    confidence = Math.max(confidence, 0.99);
  }

  return {
    candidate,
    confidence: clampConfidence(confidence),
    matchedSignals: signals,
    hasDecisiveSignal,
    primarySignalPriority,
    hasSupportingSignal,
    nameSimilarity,
    phoneticMatch,
  };
};

const compareEvaluations = (
  left: CandidateEvaluation,
  right: CandidateEvaluation,
): number => {
  if (right.primarySignalPriority !== left.primarySignalPriority) {
    return right.primarySignalPriority - left.primarySignalPriority;
  }
  if (right.confidence !== left.confidence) {
    return right.confidence - left.confidence;
  }
  return left.candidate.id.localeCompare(right.candidate.id);
};

const noMatch = (sourceEntityIds: string[]): EntityResolutionResult => ({
  status: "NO_MATCH",
  confidence: 0,
  matchedSignals: [],
  explanation:
    "No candidate shares a stable identifier, normalized phone, strong identifier, or sufficiently similar name.",
  sourceEntityIds,
  candidates: [],
});

/** Pure engine for deterministic synthetic FIR tests and explainable rules. */
export const resolvePersonAgainstCandidates = (
  request: EntityResolutionRequest,
  candidates: PersonResolutionCandidate[],
): EntityResolutionResult => {
  const normalizedRequest = normaliseRequest(request);
  const evaluations = candidates
    .map((candidate) => evaluateCandidate(normalizedRequest, candidate))
    .filter(
      (evaluation) =>
        evaluation.hasDecisiveSignal ||
        evaluation.nameSimilarity >= FUZZY_NAME_THRESHOLD ||
        evaluation.phoneticMatch,
    )
    .sort(compareEvaluations);

  const best = evaluations[0];
  if (!best) return noMatch(normalizedRequest.sourceEntityIds);

  const candidateSummaries = evaluations.slice(0, 5).map((evaluation) =>
    buildCandidateSummary(
      evaluation.candidate,
      evaluation.confidence,
      evaluation.matchedSignals,
    ),
  );
  const bestCandidate = candidateSummaries[0];
  if (!bestCandidate) return noMatch(normalizedRequest.sourceEntityIds);

  const sourceEntityIds = unique([
    ...normalizedRequest.sourceEntityIds,
    ...bestCandidate.sourceEntityIds,
  ]);
  const equallyDecisiveCandidates = evaluations.filter(
    (evaluation) =>
      evaluation.hasDecisiveSignal &&
      evaluation.primarySignalPriority === best.primarySignalPriority &&
      Math.abs(evaluation.confidence - best.confidence) < 0.01,
  );

  if (best.hasDecisiveSignal && equallyDecisiveCandidates.length === 1) {
    const exactSignal = best.matchedSignals.find(
      (signal) =>
        signal.type === "EXACT_STABLE_IDENTIFIER" ||
        signal.type === "EXACT_NORMALIZED_PHONE" ||
        signal.type === "EXACT_STRONG_IDENTIFIER",
    );
    return {
      status: "MATCHED",
      confidence: best.confidence,
      matchedSignals: best.matchedSignals,
      explanation: exactSignal
        ? `Matched using ${exactSignal.description.toLocaleLowerCase("en-IN")}`
        : "Matched using an exact high-confidence identity signal.",
      sourceEntityIds,
      candidate: bestCandidate,
      candidates: candidateSummaries,
    };
  }

  if (best.nameSimilarity >= AUTO_MATCH_NAME_THRESHOLD && best.hasSupportingSignal) {
    return {
      status: "MATCHED",
      confidence: best.confidence,
      matchedSignals: best.matchedSignals,
      explanation:
        "Matched because a high fuzzy-name similarity is corroborated by a shared supporting signal.",
      sourceEntityIds,
      candidate: bestCandidate,
      candidates: candidateSummaries,
    };
  }

  if (best.hasDecisiveSignal && equallyDecisiveCandidates.length > 1) {
    return {
      status: "POSSIBLE_MATCH",
      confidence: best.confidence,
      matchedSignals: best.matchedSignals,
      explanation:
        "Multiple candidates share an exact high-confidence signal; retain the evidence records and require review before any merge.",
      sourceEntityIds,
      candidate: bestCandidate,
      candidates: candidateSummaries,
    };
  }

  return {
    status: "POSSIBLE_MATCH",
    confidence: best.confidence,
    matchedSignals: best.matchedSignals,
    explanation: best.hasSupportingSignal
      ? "Candidate has a phonetic/name signal with supporting context, but no unique exact identifier. Review is required."
      : "Name similarity or phonetic similarity alone is never sufficient for an automatic merge.",
    sourceEntityIds,
    candidate: bestCandidate,
    candidates: candidateSummaries,
  };
};

const graphValueToStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string | number => typeof item === "string" || typeof item === "number")
    .map(String)
    .filter(Boolean);
};

const sourceEntityIdsFromProperties = (
  id: string,
  properties: Record<string, unknown>,
): string[] =>
  unique([
    id,
    ...graphValueToStringArray(properties.source_entity_ids),
    ...graphValueToStringArray(properties.sourceEntityIds),
  ]);

const isStrongIdentifierProperty = (key: string): boolean =>
  /(?:^|_)(?:government|national|aadhaar|passport|licen[cs]e|employee|external|vehicle|imei|account)(?:_|$)|^id_number$/.test(key);

const graphPersonToCandidate = (record: {
  get: (key: string) => unknown;
}): PersonResolutionCandidate | null => {
  const node = record.get("person") as { properties?: Record<string, unknown> } | undefined;
  const properties = node?.properties;
  const id = properties?.id;
  if (typeof id !== "string" || !id) return null;

  const strongIdentifiers = Object.fromEntries(
    Object.entries(properties)
      .filter(
        ([key, value]) =>
          isStrongIdentifierProperty(normalizeIdentifierKey(key)) &&
          (typeof value === "string" || typeof value === "number"),
      )
      .map(([key, value]) => [normalizeIdentifierKey(key), String(value)]),
  );

  return {
    id,
    ...(typeof properties.name === "string" ? { name: properties.name } : {}),
    ...(typeof properties.normalized_name === "string"
      ? { normalizedName: properties.normalized_name }
      : {}),
    phones: graphValueToStringArray(record.get("phones")),
    deviceIds: graphValueToStringArray(record.get("deviceIds")),
    accountIds: graphValueToStringArray(record.get("accountIds")),
    locationIds: graphValueToStringArray(record.get("locationIds")),
    caseIds: graphValueToStringArray(record.get("caseIds")),
    strongIdentifiers,
    sourceEntityIds: sourceEntityIdsFromProperties(id, properties),
  };
};

const getPersonsForResolution = async (): Promise<PersonResolutionCandidate[]> => {
  const session = neo4jDriver.session({ database: neo4jDatabase });
  try {
    const result = await session.run(`
      MATCH (person:PERSON)
      OPTIONAL MATCH (person)-[:USES]-(phone:PHONE)
      OPTIONAL MATCH (person)-[:USES|OWNS|SEEN_WITH|ASSOCIATED_WITH]-(device:DEVICE)
      OPTIONAL MATCH (person)-[:USES|OWNS|ASSOCIATED_WITH|TRANSFERRED_TO]-(account:ACCOUNT)
      OPTIONAL MATCH (person)-[:LOCATED_AT|OCCURRED_AT|ASSOCIATED_WITH]-(location:LOCATION)
      OPTIONAL MATCH (person)-[:INVOLVED_IN|PARTICIPATED_IN|ASSOCIATED_WITH]-(case:CASE)
      RETURN person,
        collect(DISTINCT coalesce(phone.normalizedValue, phone.normalized_value, phone.number, phone.value, phone.id)) AS phones,
        collect(DISTINCT coalesce(device.normalizedValue, device.normalized_value, device.imei, device.id)) AS deviceIds,
        collect(DISTINCT coalesce(account.normalizedValue, account.normalized_value, account.number, account.account_number, account.id)) AS accountIds,
        collect(DISTINCT coalesce(location.normalizedValue, location.normalized_value, location.id, location.name)) AS locationIds,
        collect(DISTINCT coalesce(case.normalizedValue, case.normalized_value, case.id, case.number)) AS caseIds
    `);

    return result.records
      .map(graphPersonToCandidate)
      .filter((candidate): candidate is PersonResolutionCandidate => candidate !== null);
  } finally {
    await session.close();
  }
};

/** Phase 2 is read-only: no Mongo evidence or Neo4j node is merged or changed. */
export const resolvePerson = async (
  request: EntityResolutionRequest,
): Promise<EntityResolutionResult> =>
  resolvePersonAgainstCandidates(request, await getPersonsForResolution());
