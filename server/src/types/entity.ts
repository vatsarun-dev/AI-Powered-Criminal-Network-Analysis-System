export const ENTITY_TYPES = [
  "PERSON",
  "LOCATION",
  "ORGANIZATION",
  "PHONE",
  "DEVICE",
  "ACCOUNT",
  "VEHICLE",
  "FIR",
  "CASE",
  "POLICE_STATION",
  "COURT",
  "CRIME_CATEGORY",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const EXTRACTION_SOURCES = ["NER", "REGEX"] as const;

export type ExtractionSource = (typeof EXTRACTION_SOURCES)[number];

/**
 * An entity extracted from a page before it is persisted. `value` is always
 * evidence text, while `normalizedValue` is derived only when saving/searching.
 */
export type ExtractedEntity = {
  entity_type: EntityType;
  value: string;
  confidence: number;
  char_offset: number;
  extractionSources?: ExtractionSource[];
  originalValues?: string[];
};
