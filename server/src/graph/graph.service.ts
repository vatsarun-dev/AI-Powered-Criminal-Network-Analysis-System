import {
  neo4jDriver,
  neo4jDatabase,
} from "../config/neo4j.js";

import type {
  NodeLabel,
  RelationshipType,
} from "./graph.constants.js";

export const createNode = async (
  label: NodeLabel,
  properties: Record<string, unknown>
) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MERGE (n:${label} {id: $id})
      SET n += $properties
      RETURN n
    `;

    const result = await session.run(query, {
      id: properties.id,
      properties,
    });

    return result.records[0]?.get("n");
  } finally {
    await session.close();
  }
};

export const createRelationship = async (
  fromLabel: NodeLabel,
  fromId: string,
  relationship: RelationshipType,
  toLabel: NodeLabel,
  toId: string,
  properties: Record<string, unknown> = {}
) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (from:${fromLabel} {id: $fromId})
      MATCH (to:${toLabel} {id: $toId})
      MERGE (from)-[r:${relationship}]->(to)
      SET r += $properties
      RETURN from, r, to
    `;

    const result = await session.run(query, {
      fromId,
      toId,
      properties,
    });

    return result.records[0];
  } finally {
    await session.close();
  }
};