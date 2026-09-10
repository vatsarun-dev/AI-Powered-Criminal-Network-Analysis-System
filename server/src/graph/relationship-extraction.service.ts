import { createHash } from "node:crypto";

import type { EntityType } from "../types/entity.js";
import { RelationshipEvidenceModel } from "../models/relationship-evidence.model.js";
import { getEntityNodeLabel } from "../modules/entity/entity-node-labels.js";
import { getGraphProjectionForEntity } from "../modules/entity/entity-graph-projection.service.js";
import type { NodeLabel, RelationshipType } from "../modules/graph/graph.constants.js";
import { createRelationship } from "../modules/graph/graph.service.js";

export const RELATIONSHIP_MODEL_VERSION = "relationship-rules-v1";

export type RelationshipExtractionEntity = {
  id: string;
  entityType: EntityType;
  value: string;
  normalizedValue: string;
  confidence: number;
  charOffset: number;
};

export type ExtractedRelationship = {
  evidenceId: string;
  relationshipType: RelationshipType;
  fromEntityId: string;
  fromLabel: NodeLabel;
  toEntityId: string;
  toLabel: NodeLabel;
  sourceEntityIds: string[];
  sourceDocumentId: string;
  pageNumber: number;
  confidence: number;
  extractedEvidence: string;
  timestamp?: string;
  modelVersion: typeof RELATIONSHIP_MODEL_VERSION;
};

type RelationshipRule = {
  relationshipType: RelationshipType;
  sourceTypes: EntityType[];
  targetTypes: EntityType[];
  trigger: RegExp;
  confidence: number;
};

type EvidenceSegment = {
  text: string;
  start: number;
  end: number;
};

const relationshipRules: RelationshipRule[] = [
  {
    relationshipType: "ACCUSED_IN",
    sourceTypes: ["PERSON"],
    targetTypes: ["FIR", "CASE"],
    trigger:
      /\b(?:accused|named\s+as\s+(?:an?\s+)?accused|shown\s+as\s+(?:an?\s+)?accused)\b/i,
    confidence: 0.95,
  },
  {
    relationshipType: "VICTIM_IN",
    sourceTypes: ["PERSON"],
    targetTypes: ["FIR", "CASE"],
    trigger: /\b(?:victim|complainant|aggrieved\s+person)\b/i,
    confidence: 0.93,
  },
  {
    relationshipType: "CLASSIFIED_AS",
    sourceTypes: ["FIR", "CASE"],
    targetTypes: ["CRIME_CATEGORY"],
    trigger:
      /\b(?:classified\s+as|crime\s+category|offen[cs]e(?:\s+category)?)\b/i,
    confidence: 0.94,
  },
  {
    relationshipType: "REGISTERED_AT",
    sourceTypes: ["FIR", "CASE"],
    targetTypes: ["POLICE_STATION"],
    trigger: /\b(?:registered\s+(?:at|with)|lodged\s+(?:at|with))\b/i,
    confidence: 0.95,
  },
  {
    relationshipType: "HEARD_IN",
    sourceTypes: ["FIR", "CASE"],
    targetTypes: ["COURT"],
    trigger:
      /\b(?:heard\s+(?:in|at)|pending\s+before|before\s+(?:the\s+)?court)\b/i,
    confidence: 0.93,
  },
  {
    relationshipType: "OCCURRED_AT",
    sourceTypes: ["FIR", "CASE"],
    targetTypes: ["LOCATION"],
    trigger:
      /\b(?:occurred\s+at|place\s+of\s+occurrence|incident\s+location|took\s+place\s+at)\b/i,
    confidence: 0.93,
  },
  {
    relationshipType: "USES",
    sourceTypes: ["PERSON"],
    targetTypes: ["PHONE", "DEVICE", "ACCOUNT"],
    trigger:
      /\b(?:uses?|using|contact(?:\s+(?:number|phone))?|mobile(?:\s+(?:number|phone))?|phone(?:\s+(?:number|no\.?))?)\b/i,
    confidence: 0.9,
  },
  {
    relationshipType: "OWNS",
    sourceTypes: ["PERSON"],
    targetTypes: ["VEHICLE", "DEVICE", "ACCOUNT"],
    trigger: /\b(?:owns?|owner\s+of|registered\s+owner|belongs\s+to)\b/i,
    confidence: 0.91,
  },
  {
    relationshipType: "ASSOCIATED_WITH",
    sourceTypes: ["PERSON"],
    targetTypes: ["PERSON"],
    trigger: /\b(?:associated\s+with|linked\s+to|in\s+association\s+with)\b/i,
    confidence: 0.87,
  },
  {
    relationshipType: "SEEN_WITH",
    sourceTypes: ["PERSON"],
    targetTypes: ["PERSON", "DEVICE"],
    trigger: /\b(?:seen\s+with|found\s+with|observed\s+with)\b/i,
    confidence: 0.89,
  },
  {
    relationshipType: "TRANSFERRED_TO",
    sourceTypes: ["PERSON", "ACCOUNT"],
    targetTypes: ["PERSON", "ACCOUNT"],
    trigger: /\b(?:transferred\s+to|transfer(?:red)?\s+into|remitted\s+to)\b/i,
    confidence: 0.9,
  },
];

const clampConfidence = (value: number): number =>
  Math.round(Math.min(0.99, Math.max(0, value)) * 100) / 100;

const splitEvidenceSegments = (text: string): EvidenceSegment[] => {
  const segments: EvidenceSegment[] = [];
  const boundary = /[.!?]|\n+/g;
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = boundary.exec(text)) !== null) {
    const end = match.index + match[0].length;
    const previousText = text
      .slice(Math.max(0, match.index - 4), end)
      .toLowerCase();
    // Do not split after conventional FIR/P.S. abbreviations such as "No.".
    if (/\b(?:no|p\.s)\.$/.test(previousText)) {
      continue;
    }

    const evidence = text.slice(start, end).trim();
    if (evidence) {
      const leadingWhitespace = text.slice(start, end).search(/\S/);
      segments.push({
        text: evidence,
        start: start + Math.max(leadingWhitespace, 0),
        end,
      });
    }
    start = end;
  }

  const finalEvidence = text.slice(start).trim();
  if (finalEvidence) {
    const leadingWhitespace = text.slice(start).search(/\S/);
    segments.push({
      text: finalEvidence,
      start: start + Math.max(leadingWhitespace, 0),
      end: text.length,
    });
  }

  return segments;
};

const entitiesInSegment = (
  entities: RelationshipExtractionEntity[],
  segment: EvidenceSegment,
): RelationshipExtractionEntity[] =>
  entities.filter(
    (entity) =>
      entity.charOffset >= segment.start && entity.charOffset < segment.end,
  );

const explicitTimestamp = (text: string): string | undefined => {
  const match = text.match(
    /\b(?:incident\s+date|date\s+of\s+occurrence|date|dated|timestamp)\s*[:\-]?\s*(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/i,
  );
  if (!match) return undefined;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const suppliedYear = Number(match[3]);
  const year = suppliedYear < 100 ? 2000 + suppliedYear : suppliedYear;
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }

  return date.toISOString();
};

/**
 * All supported rules are expressed in the conservative forward form
 * `source ... trigger ... target`. Restricting an assertion to the closest
 * typed endpoints around the trigger prevents a sentence with several people
 * or cases from generating unsupported cross-product relationships.
 */
const endpointsForRuleTrigger = (
  rule: RelationshipRule,
  entities: RelationshipExtractionEntity[],
  triggerStart: number,
  triggerEnd: number,
): [RelationshipExtractionEntity, RelationshipExtractionEntity] | null => {
  const source = entities
    .filter(
      (entity) =>
        rule.sourceTypes.includes(entity.entityType) &&
        entity.charOffset < triggerStart,
    )
    .sort((left, right) => right.charOffset - left.charOffset)[0];
  const target = entities
    .filter(
      (entity) =>
        rule.targetTypes.includes(entity.entityType) &&
        entity.charOffset >= triggerEnd,
    )
    .sort((left, right) => left.charOffset - right.charOffset)[0];

  if (!source || !target || source.id === target.id) {
    return null;
  }

  return [source, target];
};

const findRuleTriggers = (
  trigger: RegExp,
  text: string,
): Array<{ start: number; end: number }> => {
  const flags = trigger.flags.includes("g")
    ? trigger.flags
    : `${trigger.flags}g`;
  const matcher = new RegExp(trigger.source, flags);
  const matches: Array<{ start: number; end: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length });
  }

  return matches;
};

const evidenceIdFor = (
  sourceDocumentId: string,
  pageNumber: number,
  relationshipType: RelationshipType,
  fromEntityId: string,
  toEntityId: string,
  evidenceStart: number,
  evidence: string,
): string =>
  createHash("sha256")
    .update(
      [
        sourceDocumentId,
        pageNumber,
        relationshipType,
        fromEntityId,
        toEntityId,
        evidenceStart,
        evidence,
      ].join("|"),
    )
    .digest("hex");

/**
 * Extract only when a relationship-specific lexical trigger and both typed
 * endpoints appear in the same evidence segment. Entity co-occurrence alone
 * is deliberately ignored.
 */
export const extractEvidenceBackedRelationships = (input: {
  text: string;
  sourceDocumentId: string;
  pageNumber: number;
  entities: RelationshipExtractionEntity[];
}): ExtractedRelationship[] => {
  const relationships: ExtractedRelationship[] = [];
  const seenEvidenceIds = new Set<string>();

  for (const segment of splitEvidenceSegments(input.text)) {
    const segmentEntities = entitiesInSegment(input.entities, segment);
    if (segmentEntities.length < 2) continue;

    for (const rule of relationshipRules) {
      for (const trigger of findRuleTriggers(rule.trigger, segment.text)) {
        const endpoints = endpointsForRuleTrigger(
          rule,
          segmentEntities,
          segment.start + trigger.start,
          segment.start + trigger.end,
        );
        if (!endpoints) continue;
        const [from, to] = endpoints;
        const evidenceId = evidenceIdFor(
          input.sourceDocumentId,
          input.pageNumber,
          rule.relationshipType,
          from.id,
          to.id,
          segment.start,
          segment.text,
        );
        if (seenEvidenceIds.has(evidenceId)) continue;
        seenEvidenceIds.add(evidenceId);
        const timestamp = explicitTimestamp(segment.text);

        const relationship: ExtractedRelationship = {
          evidenceId,
          relationshipType: rule.relationshipType,
          fromEntityId: from.id,
          fromLabel: getEntityNodeLabel(from.entityType),
          toEntityId: to.id,
          toLabel: getEntityNodeLabel(to.entityType),
          sourceEntityIds: [from.id, to.id],
          sourceDocumentId: input.sourceDocumentId,
          pageNumber: input.pageNumber,
          confidence: clampConfidence(
            Math.min(
              rule.confidence,
              0.75 + Math.min(from.confidence, to.confidence) * 0.24,
            ),
          ),
          extractedEvidence: segment.text,
          ...(timestamp ? { timestamp } : {}),
          modelVersion: RELATIONSHIP_MODEL_VERSION,
        };
        relationships.push(relationship);
      }
    }
  }

  return relationships;
};

/**
 * Persists evidence in MongoDB before mirroring it to Neo4j. `evidenceId` in
 * the relationship MERGE identity ensures distinct documents/pages retain
 * separate provenance instead of overwriting one another.
 */
export const persistExtractedRelationships = async (
  relationships: ExtractedRelationship[],
): Promise<void> => {
  for (const relationship of relationships) {
    await RelationshipEvidenceModel.updateOne(
      { evidenceId: relationship.evidenceId },
      { $setOnInsert: relationship },
      { upsert: true },
    );

    const [fromProjection, toProjection] = await Promise.all([
      getGraphProjectionForEntity(relationship.fromEntityId),
      getGraphProjectionForEntity(relationship.toEntityId),
    ]);

    await createRelationship(
      fromProjection.nodeLabel,
      fromProjection.graphNodeId,
      relationship.relationshipType,
      toProjection.nodeLabel,
      toProjection.graphNodeId,
      {
        evidenceId: relationship.evidenceId,
        fromEntityId: relationship.fromEntityId,
        toEntityId: relationship.toEntityId,
        fromGraphNodeId: fromProjection.graphNodeId,
        toGraphNodeId: toProjection.graphNodeId,
        sourceDocumentId: relationship.sourceDocumentId,
        pageNumber: relationship.pageNumber,
        confidence: relationship.confidence,
        extractedEvidence: relationship.extractedEvidence,
        modelVersion: relationship.modelVersion,
        sourceEntityIds: relationship.sourceEntityIds,
        ...(relationship.timestamp
          ? { timestamp: relationship.timestamp }
          : {}),
      },
    );
  }
};
