import type { EntityType } from "../../types/entity.js";
import type { NodeLabel } from "../graph/graph.constants.js";

/**
 * Extracted FIR identifiers and case identifiers represent the same graph
 * concept. Their evidence records remain distinct Mongo entities.
 */
export const ENTITY_TO_NODE_LABEL: Record<EntityType, NodeLabel> = {
  PERSON: "PERSON",
  LOCATION: "LOCATION",
  ORGANIZATION: "ORGANIZATION",
  PHONE: "PHONE",
  DEVICE: "DEVICE",
  ACCOUNT: "ACCOUNT",
  VEHICLE: "VEHICLE",
  FIR: "CASE",
  CASE: "CASE",
  POLICE_STATION: "POLICE_STATION",
  COURT: "COURT",
  CRIME_CATEGORY: "CRIME_CATEGORY",
  EVENT: "EVENT",
};

export const getEntityNodeLabel = (entityType: EntityType): NodeLabel =>
  ENTITY_TO_NODE_LABEL[entityType];
