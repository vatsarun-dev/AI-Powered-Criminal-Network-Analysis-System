import { EntityModel } from "../../models/entity.model.js";
import type { EntityType } from "../../types/entity.js";

import { getEntityNodeLabel } from "./entity-node-labels.js";
import type { NodeLabel } from "../graph/graph.constants.js";
import { createNode } from "../graph/graph.service.js";

type EntityGraphSource = {
  _id: { toString(): string };
  entityType: EntityType;
  value: string;
  normalizedValue: string;
  confidence: number;
  sourceDocumentId: { toString(): string };
  pageNumber: number;
  charOffset: number;
};

export type EntityGraphProjection = {
  sourceEntityId: string;
  graphNodeId: string;
  nodeLabel: NodeLabel;
};

const stablePrefixForType: Record<EntityType, string> = {
  PERSON: "person",
  PHONE: "phone",
  DEVICE: "device",
  ACCOUNT: "account",
  VEHICLE: "vehicle",
  LOCATION: "location",
  ORGANIZATION: "organization",
  FIR: "case",
  CASE: "case",
  POLICE_STATION: "police-station",
  COURT: "court",
  CRIME_CATEGORY: "crime-category",
};

/**
 * Structured entities have an exact normalized identifier and can safely
 * project to one graph node. A PERSON never uses name-only identity: it stays
 * tied to its evidence entity until an explicit Phase 2 match is persisted.
 */
export const graphNodeIdForEntity = (
  entity: Pick<EntityGraphSource, "_id" | "entityType" | "normalizedValue">,
): string => {
  const sourceEntityId = entity._id.toString();
  if (entity.entityType === "PERSON") {
    return `person:${sourceEntityId}`;
  }

  return `${stablePrefixForType[entity.entityType]}:${entity.normalizedValue}`;
};

const projectionForEntity = (entity: EntityGraphSource): EntityGraphProjection => ({
  sourceEntityId: entity._id.toString(),
  graphNodeId: graphNodeIdForEntity(entity),
  nodeLabel: getEntityNodeLabel(entity.entityType),
});

const syncProjection = async (
  entity: EntityGraphSource,
): Promise<EntityGraphProjection> => {
  const projection = projectionForEntity(entity);

  await createNode(
    projection.nodeLabel,
    {
      id: projection.graphNodeId,
      name: entity.value,
      normalized_name: entity.normalizedValue,
      entity_type: entity.entityType,
      confidence: entity.confidence,
      page_number: entity.pageNumber,
      char_offset: entity.charOffset,
    },
    {
      sourceEntityIds: [projection.sourceEntityId],
      sourceDocumentIds: [entity.sourceDocumentId.toString()],
      sourceValues: [entity.value],
    },
  );

  return projection;
};

export const syncEntityToGraph = async (
  entityId: string,
): Promise<EntityGraphProjection> => {
  const entity = await EntityModel.findById(entityId).lean();
  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  return syncProjection(entity as unknown as EntityGraphSource);
};

export const getGraphProjectionForEntity = async (
  entityId: string,
): Promise<EntityGraphProjection> => {
  const entity = await EntityModel.findById(entityId).lean();
  if (!entity) {
    throw new Error(`Entity not found: ${entityId}`);
  }

  return projectionForEntity(entity as unknown as EntityGraphSource);
};
