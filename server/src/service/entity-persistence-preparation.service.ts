import type { ExtractedEntity } from "../types/entity.js";
import { normalizeEntityValue } from "./entity-normalization.service.js";

type PrepareEntityDocumentsParams = {
  entities: ExtractedEntity[];
  sourceDocumentId: string;
  pageNumber: number;
};

/**
 * Pure preparation step kept separate from database writes so the evidence
 * contract can be tested without MongoDB or Neo4j.
 */
export const prepareEntityDocuments = ({
  entities,
  sourceDocumentId,
  pageNumber,
}: PrepareEntityDocumentsParams) =>
  entities.flatMap((entity) => {
    const normalizedValue = normalizeEntityValue(entity.value, entity.entity_type);
    if (!normalizedValue) {
      return [];
    }

    return [
      {
        entityType: entity.entity_type,
        value: entity.value,
        normalizedValue,
        confidence: entity.confidence,
        sourceDocumentId,
        pageNumber,
        charOffset: entity.char_offset,
        extractionSources:
          entity.extractionSources?.length ? entity.extractionSources : ["NER"],
        originalValues:
          entity.originalValues?.length ? entity.originalValues : [entity.value],
      },
    ];
  });
