import { EntityModel } from "../../models/entity.model.js";

import type { NERResult } from "../../service/ner.service.js";

import { normalizeEntityValue } from "../../service/entity-normalization.service.js";

import { syncEntityToGraph } from "./entity-graph.service.js";

type SaveEntitiesParams = {
  entities: NERResult[];

  sourceDocumentId: string;

  pageNumber: number;
};

export const saveEntities = async ({
  entities,
  sourceDocumentId,
  pageNumber,
}: SaveEntitiesParams) => {
  if (!entities.length) {
    return [];
  }

  const documents = entities.map((entity) => ({
    entityType: entity.entity_type,

    // Preserve original NER output
    value: entity.value,

    // Store normalized searchable value
    normalizedValue: normalizeEntityValue(entity.value, entity.entity_type),

    confidence: entity.confidence,

    sourceDocumentId,

    pageNumber,

    charOffset: entity.char_offset,
  }));

  // Save entities in MongoDB
  const savedEntities = await EntityModel.insertMany(documents);

  // Sync every saved entity to Neo4j
  for (const entity of savedEntities) {
    await syncEntityToGraph(entity._id.toString());
  }

  return savedEntities;
};
