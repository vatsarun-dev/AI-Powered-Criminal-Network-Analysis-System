import { createNode } from "../../graph/graph.service.js";

import type { NodeLabel } from "../../graph/graph.constants.js";

import { EntityModel } from "../../models/entity.model.js";

const ENTITY_TO_NODE_LABEL: Record<string, NodeLabel> = {
  PERSON: "PERSON",
  LOCATION: "LOCATION",
  ORGANIZATION: "ORGANIZATION",
};

export const syncEntityToGraph = async (entityId: string) => {
  const entity = await EntityModel.findById(entityId).lean();

  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  const nodeLabel = ENTITY_TO_NODE_LABEL[entity.entityType];

  if (!nodeLabel) {
    throw new Error(`Unsupported entity type: ${entity.entityType}`);
  }

  return createNode(nodeLabel, {
    id: entity._id.toString(),

    name: entity.value,

    normalized_name: entity.normalizedValue,

    confidence: entity.confidence,

    source_doc_id: entity.sourceDocumentId.toString(),

    page_number: entity.pageNumber,

    char_offset: entity.charOffset,
  });
};
