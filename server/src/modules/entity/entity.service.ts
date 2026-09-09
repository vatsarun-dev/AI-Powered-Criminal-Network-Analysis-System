import { EntityModel } from "../../models/entity.model.js";

import type { NERResult } from "../../service/ner.service.js";

import { syncEntityToGraph } from "./entity-graph.service.js";
import { prepareEntityDocuments } from "../../service/entity-persistence-preparation.service.js";
import {
  extractEvidenceBackedRelationships,
  persistExtractedRelationships,
} from "../../graph/relationship-extraction.service.js";
import type { EntityType } from "../../types/entity.js";

type SaveEntitiesParams = {
  entities: NERResult[];

  sourceDocumentId: string;

  pageNumber: number;

  text: string;
};

export const saveEntities = async ({
  entities,
  sourceDocumentId,
  pageNumber,
  text,
}: SaveEntitiesParams) => {
  if (!entities.length) {
    return [];
  }

  const documents = prepareEntityDocuments({
    entities,
    sourceDocumentId,
    pageNumber,
  });

  if (!documents.length) {
    return [];
  }

  // Save entities in MongoDB
  const savedEntities = await EntityModel.insertMany(documents);

  // Sync every saved entity to Neo4j
  for (const entity of savedEntities) {
    await syncEntityToGraph(entity._id.toString());
  }

  /*
   * Phase 2 remains non-destructive: these source entity IDs are retained as
   * graph node IDs until an explicit reviewed resolution decision exists.
   */
  const relationships = extractEvidenceBackedRelationships({
    text,
    sourceDocumentId,
    pageNumber,
    entities: savedEntities.map((entity) => ({
      id: entity._id.toString(),
      entityType: entity.entityType as EntityType,
      value: entity.value,
      normalizedValue: entity.normalizedValue,
      confidence: entity.confidence,
      charOffset: entity.charOffset,
    })),
  });

  await persistExtractedRelationships(relationships);

  return savedEntities;
};
