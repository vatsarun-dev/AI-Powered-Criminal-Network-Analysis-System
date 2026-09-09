import type {
  ExtractedEntity,
  ExtractionSource,
} from "../types/entity.js";
import { normalizeEntityValue } from "./entity-normalization.service.js";

const unique = <T>(values: T[]): T[] => [...new Set(values)];

const spansOverlap = (left: ExtractedEntity, right: ExtractedEntity): boolean => {
  const leftEnd = left.char_offset + left.value.length;
  const rightEnd = right.char_offset + right.value.length;

  return left.char_offset < rightEnd && right.char_offset < leftEnd;
};

const entitySources = (entity: ExtractedEntity): ExtractionSource[] =>
  entity.extractionSources?.length ? entity.extractionSources : ["NER"];

const entityOriginalValues = (entity: ExtractedEntity): string[] =>
  entity.originalValues?.length ? entity.originalValues : [entity.value];

/**
 * Combine only overlapping extractions of the same canonical typed value.
 * Separate mentions elsewhere on the page are retained as distinct evidence.
 */
export const deduplicateExtractedEntities = (
  entities: ExtractedEntity[],
): ExtractedEntity[] => {
  const results: ExtractedEntity[] = [];

  for (const entity of entities) {
    const normalizedValue = normalizeEntityValue(entity.value, entity.entity_type);
    if (!normalizedValue) {
      continue;
    }

    const duplicate = results.find(
      (candidate) =>
        candidate.entity_type === entity.entity_type &&
        normalizeEntityValue(candidate.value, candidate.entity_type) ===
          normalizedValue &&
        spansOverlap(candidate, entity),
    );

    if (!duplicate) {
      results.push({
        ...entity,
        extractionSources: unique(entitySources(entity)),
        originalValues: unique(entityOriginalValues(entity)),
      });
      continue;
    }

    duplicate.confidence = Math.max(duplicate.confidence, entity.confidence);
    duplicate.extractionSources = unique([
      ...entitySources(duplicate),
      ...entitySources(entity),
    ]);
    duplicate.originalValues = unique([
      ...entityOriginalValues(duplicate),
      ...entityOriginalValues(entity),
    ]);
  }

  return results;
};
