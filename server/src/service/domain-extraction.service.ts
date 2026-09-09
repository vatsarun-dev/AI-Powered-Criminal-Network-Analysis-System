import type { ExtractedEntity } from "../types/entity.js";
import { normalizeEntityValue } from "./entity-normalization.service.js";
import { deduplicateExtractedEntities } from "./entity-deduplication.service.js";

const DOMAIN_CONFIDENCE = 0.99;

const phonePattern =
  /(?<!\d)(?:\+91[\s-]*|91[\s-]+)?[6-9]\d{4}[\s-]?\d{5}(?!\d)/g;
const vehiclePattern =
  /(?<![A-Z0-9])[A-Z]{2}[\s-]?\d{1,2}[\s-]?[A-Z]{1,3}[\s-]?\d{1,4}(?![A-Z0-9])/gi;
const firWithPrefixPattern =
  /\bFIR\s*(?:NO\.?|NUMBER)?\s*[-:#]?\s*\d{1,6}\s*\/\s*(?:19|20)\d{2}\b/gi;
const firNumberPattern = /(?<![\d/])\d{1,6}\s*\/\s*(?:19|20)\d{2}\b/g;
const caseWithPrefixPattern =
  /\bCASE\s*(?:NO\.?|NUMBER)?\s*[-:#]?\s*\d{1,6}(?:\s*\/\s*(?:19|20)\d{2})?\b/gi;
const devicePattern =
  /\bIMEI\b\s*(?:NO\.?|NUMBER)?\s*[:#-]?\s*([A-Z0-9]{8,24})\b/gi;
const accountPattern =
  /\b(?:A\s*\/\s*C|ACCOUNT)\b\s*(?:NO\.?|NUMBER)?\s*[:#-]?\s*([A-Z0-9]{6,24})\b/gi;
const policeStationPattern =
  /\b(?:[A-Z][\p{L}.'-]*\s+){0,3}(?:Police|POLICE)\s+(?:Station|STATION)\b/gu;
const courtPattern =
  /\b(?:[A-Z][\p{L}.'-]*\s+){0,3}(?:District|Sessions|High|DISTRICT|SESSIONS|HIGH)\s+(?:Court|COURT)\b/gu;
const crimeCategoryPattern =
  /\b(?:CRIME\s+CATEGORY|OFFEN[CS]E(?:\s+CATEGORY)?)\s*[:\-]\s*([A-Z][\p{L} -]{1,80}?)(?=[.;\n]|$)/giu;

const collectMatches = (
  text: string,
  pattern: RegExp,
  entityType: ExtractedEntity["entity_type"],
): ExtractedEntity[] => {
  const entities: ExtractedEntity[] = [];
  let match: RegExpExecArray | null;

  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    const value = match[0];

    if (!normalizeEntityValue(value, entityType)) {
      continue;
    }

    entities.push({
      entity_type: entityType,
      value,
      confidence: DOMAIN_CONFIDENCE,
      char_offset: match.index,
      extractionSources: ["REGEX"],
      originalValues: [value],
    });
  }

  return entities;
};

const collectCapturedMatches = (
  text: string,
  pattern: RegExp,
  entityType: ExtractedEntity["entity_type"],
): ExtractedEntity[] => {
  const entities: ExtractedEntity[] = [];
  let match: RegExpExecArray | null;

  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    const value = match[1]?.trim();
    if (!value || !normalizeEntityValue(value, entityType)) {
      continue;
    }

    const valueOffset = match[0].indexOf(value);
    entities.push({
      entity_type: entityType,
      value,
      confidence: DOMAIN_CONFIDENCE,
      char_offset: match.index + Math.max(valueOffset, 0),
      extractionSources: ["REGEX"],
      originalValues: [value],
    });
  }

  return entities;
};

/**
 * Extract stable, Indian-format identifiers independently of the general NER
 * model. It intentionally does not infer people or relationships.
 */
export const extractDomainEntities = (text: string): ExtractedEntity[] => {
  if (!text.trim()) {
    return [];
  }

  return deduplicateExtractedEntities([
    ...collectMatches(text, phonePattern, "PHONE"),
    ...collectMatches(text, vehiclePattern, "VEHICLE"),
    ...collectMatches(text, firWithPrefixPattern, "FIR"),
    ...collectMatches(text, firNumberPattern, "FIR"),
    ...collectMatches(text, caseWithPrefixPattern, "CASE"),
    ...collectCapturedMatches(text, devicePattern, "DEVICE"),
    ...collectCapturedMatches(text, accountPattern, "ACCOUNT"),
    ...collectMatches(text, policeStationPattern, "POLICE_STATION"),
    ...collectMatches(text, courtPattern, "COURT"),
    ...collectCapturedMatches(text, crimeCategoryPattern, "CRIME_CATEGORY"),
  ]);
};
