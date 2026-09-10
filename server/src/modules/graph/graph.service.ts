import { neo4jDriver, neo4jDatabase } from "../../config/neo4j.js";
import type { Session } from "neo4j-driver";

import type { NodeLabel, RelationshipType } from "./graph.constants.js";

export type NodeProvenance = {
  sourceEntityIds?: string[];
  sourceDocumentIds?: string[];
  sourceValues?: string[];
};

const uniqueStrings = (values: string[] | undefined): string[] =>
  [...new Set((values ?? []).filter((value) => value.trim().length > 0))];

/**
 * Opens a Neo4j session, runs `work` against it, and guarantees the session
 * is closed afterwards — even if `work` throws.
 *
 * NOTE: identical to the helper in graph.service.ts / graphAnalytics.service.ts.
 * Worth extracting into one shared module (e.g. `./graph.session.js`) and
 * importing it in all three instead of keeping separate copies.
 */
export const withSession = async <T>(
  work: (session: Session) => Promise<T>,
): Promise<T> => {
  const session = neo4jDriver.session({ database: neo4jDatabase });
  try {
    return await work(session);
  } finally {
    await session.close();
  }
};

export const createNode = (
  label: NodeLabel,
  properties: Record<string, unknown>,
  provenance: NodeProvenance = {},
) =>
  withSession(async (session) => {
    const sourceEntityIds = uniqueStrings(provenance.sourceEntityIds);
    const sourceDocumentIds = uniqueStrings(provenance.sourceDocumentIds);
    const sourceValues = uniqueStrings(provenance.sourceValues);
    const query = `
      MERGE (n:${label} {id: $id})
      SET n += $properties
      WITH n,
        reduce(values = [], value IN coalesce(n.source_entity_ids, []) + $sourceEntityIds |
          CASE WHEN value IN values THEN values ELSE values + value END) AS mergedSourceEntityIds,
        reduce(values = [], value IN coalesce(n.source_document_ids, []) + $sourceDocumentIds |
          CASE WHEN value IN values THEN values ELSE values + value END) AS mergedSourceDocumentIds,
        reduce(values = [], value IN coalesce(n.source_values, []) + $sourceValues |
          CASE WHEN value IN values THEN values ELSE values + value END) AS mergedSourceValues
      FOREACH (_ IN CASE WHEN size($sourceEntityIds) > 0 THEN [1] ELSE [] END |
        SET n.source_entity_ids = mergedSourceEntityIds)
      FOREACH (_ IN CASE WHEN size($sourceDocumentIds) > 0 THEN [1] ELSE [] END |
        SET n.source_document_ids = mergedSourceDocumentIds)
      FOREACH (_ IN CASE WHEN size($sourceValues) > 0 THEN [1] ELSE [] END |
        SET n.source_values = mergedSourceValues)
      RETURN n
    `;

    const result = await session.run(query, {
      id: properties.id,
      properties,
      sourceEntityIds,
      sourceDocumentIds,
      sourceValues,
    });

    return result.records[0]?.get("n");
  });

export const createRelationship = (
  fromLabel: NodeLabel,
  fromId: string,
  relationship: RelationshipType,
  toLabel: NodeLabel,
  toId: string,
  properties: Record<string, unknown> = {},
) =>
  withSession(async (session) => {
    const evidenceId =
      typeof properties.evidenceId === "string" && properties.evidenceId
        ? properties.evidenceId
        : undefined;
    const relationshipIdentity = evidenceId
      ? " {evidenceId: $evidenceId}"
      : "";
    const query = `
      MATCH (from:${fromLabel} {id: $fromId})
      MATCH (to:${toLabel} {id: $toId})
      MERGE (from)-[r:${relationship}${relationshipIdentity}]->(to)
      SET r += $properties
      RETURN from, r, to
    `;

    const parameters = {
      fromId,
      toId,
      properties,
      ...(evidenceId ? { evidenceId } : {}),
    };

    const result = await session.run(query, parameters);

    return result.records[0];
  });