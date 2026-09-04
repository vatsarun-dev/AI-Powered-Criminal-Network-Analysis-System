export const NODE_LABELS = [
  "PERSON",
  "PHONE",
  "DEVICE",
  "ACCOUNT",
  "LOCATION",
  "CASE",
  "EVENT",
] as const;

export type NodeLabel = (typeof NODE_LABELS)[number];

export const RELATIONSHIP_TYPES = [
  "USES",
  "OWNS",
  "LOCATED_AT",
  "INVOLVED_IN",
  "PARTICIPATED_IN",
  "ASSOCIATED_WITH",
  "SEEN_WITH",
  "TRANSFERRED_TO",
  "OCCURRED_AT",
  "RELATED_TO",
] as const;

export type RelationshipType =
  (typeof RELATIONSHIP_TYPES)[number];