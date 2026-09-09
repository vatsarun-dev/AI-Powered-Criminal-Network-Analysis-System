import { createNode } from "../../graph/graph.service.js";

import { getEntityNodeLabel } from "../../graph/entity-node-labels.js";

import { EntityModel } from "../../models/entity.model.js";

export const syncEntityToGraph = async (entityId: string) => {
  const entity = await EntityModel.findById(entityId).lean();

  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  const nodeLabel = getEntityNodeLabel(entity.entityType);

  return createNode(nodeLabel, {
    id: entity._id.toString(),

    name: entity.value,

    normalized_name: entity.normalizedValue,

    entity_type: entity.entityType,

    confidence: entity.confidence,

    source_doc_id: entity.sourceDocumentId.toString(),

    page_number: entity.pageNumber,

    char_offset: entity.charOffset,
  });
};
