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

/**
 * Extract stable, Indian-format identifiers independently of the general NER
 * model. It intentionally does not infer people, places, or relationships.
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
  ]);
};
