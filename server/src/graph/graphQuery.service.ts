import {
  neo4jDriver,
  neo4jDatabase,
} from "../config/neo4j.js";
import neo4j from "neo4j-driver";
import type { Node, Relationship } from "neo4j-driver";

import type { NodeLabel, RelationshipType } from "./graph.constants.js";

export type GraphNodeView = {
  id: string;
  labels: string[];
  name?: string;
  properties: Record<string, unknown>;
};

export type GraphRelationshipView = {
  id: string;
  type: string;
  fromId: string;
  toId: string;
  properties: Record<string, unknown>;
};

export type GraphNetwork = {
  nodes: GraphNodeView[];
  relationships: GraphRelationshipView[];
};

export type GraphFilter = {
  nodeId?: string;
  nodeLabels?: NodeLabel[];
  relationshipTypes?: RelationshipType[];
  sourceDocumentId?: string;
  limit?: number;
};

const serializeGraphValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(serializeGraphValue);
  if (!value || typeof value !== "object") return value;

  if ("toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      serializeGraphValue(nestedValue),
    ]),
  );
};

const graphProperties = (properties: Record<string, unknown>): Record<string, unknown> =>
  serializeGraphValue(properties) as Record<string, unknown>;

const toGraphNodeView = (node: Node): GraphNodeView => ({
  id: String(node.properties.id),
  labels: [...node.labels],
  ...(typeof node.properties.name === "string" ? { name: node.properties.name } : {}),
  properties: graphProperties(node.properties),
});

const toGraphRelationshipView = (
  relationship: Relationship,
  fromId: string,
  toId: string,
): GraphRelationshipView => ({
  id: relationship.elementId,
  type: relationship.type,
  fromId,
  toId,
  properties: graphProperties(relationship.properties),
});

const toNumber = (value: unknown): number => {
  const serialised = serializeGraphValue(value);
  return typeof serialised === "number" ? serialised : Number(serialised);
};

const buildNetworkFromRelationshipRecords = (
  records: Array<{ get: (key: string) => unknown }>,
): GraphNetwork => {
  const nodeById = new Map<string, GraphNodeView>();
  const relationshipById = new Map<string, GraphRelationshipView>();

  for (const record of records) {
    const from = record.get("from") as Node;
    const to = record.get("to") as Node;
    const relationship = record.get("relationship") as Relationship;
    const fromNode = toGraphNodeView(from);
    const toNode = toGraphNodeView(to);
    nodeById.set(fromNode.id, fromNode);
    nodeById.set(toNode.id, toNode);
    const relationshipView = toGraphRelationshipView(
      relationship,
      fromNode.id,
      toNode.id,
    );
    relationshipById.set(relationshipView.id, relationshipView);
  }

  return {
    nodes: [...nodeById.values()],
    relationships: [...relationshipById.values()],
  };
};

export const searchGraphNodes = async (search: string) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (n)
      WHERE
        toLower(coalesce(n.id, "")) CONTAINS toLower($search)
        OR toLower(coalesce(n.name, "")) CONTAINS toLower($search)
      RETURN
        n.id AS id,
        labels(n) AS labels,
        n.name AS name,
        properties(n) AS properties
      ORDER BY name
      LIMIT 50
    `;

    const result = await session.run(query, {
      search,
    });

    return result.records.map((record) => ({
      id: record.get("id"),
      labels: record.get("labels"),
      name: record.get("name"),
      properties: record.get("properties"),
    }));
  } finally {
    await session.close();
  }
};

export const getNodeConnections = async (id: string) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (source {id: $id})-[r]-(target)
      RETURN
        source.id AS sourceId,
        labels(source) AS sourceLabels,
        type(r) AS relationship,
        properties(r) AS relationshipProperties,
        target.id AS targetId,
        labels(target) AS targetLabels,
        target.name AS targetName,
        properties(target) AS targetProperties
    `;

    const result = await session.run(query, {
      id,
    });

    return result.records.map((record) => ({
      source: {
        id: record.get("sourceId"),
        labels: record.get("sourceLabels"),
      },
      relationship: {
        type: record.get("relationship"),
        properties: record.get("relationshipProperties"),
      },
      target: {
        id: record.get("targetId"),
        labels: record.get("targetLabels"),
        name: record.get("targetName"),
        properties: record.get("targetProperties"),
      },
    }));
  } finally {
    await session.close();
  }
};

export const getShortestPath = async (
  from: string,
  to: string
) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (source {id: $from})
      MATCH (target {id: $to})
      MATCH path = shortestPath(
        (source)-[*1..10]-(target)
      )
      RETURN
        [node IN nodes(path) | {
          id: node.id,
          labels: labels(node),
          name: node.name
        }] AS nodes,
        [rel IN relationships(path) | {
          type: type(rel),
          properties: properties(rel)
        }] AS relationships,
        length(path) AS hops
    `;

    const result = await session.run(query, {
      from,
      to,
    });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0]!;

    return {
      nodes: serializeGraphValue(record.get("nodes")),
      relationships: serializeGraphValue(record.get("relationships")),
      hops: toNumber(record.get("hops")),
    };
  } finally {
    await session.close();
  }
};

export const getGraphNode = async (id: string): Promise<GraphNodeView | null> => {
  const session = neo4jDriver.session({ database: neo4jDatabase });

  try {
    const result = await session.run(
      "MATCH (node {id: $id}) RETURN node LIMIT 1",
      { id },
    );
    const node = result.records[0]?.get("node") as Node | undefined;

    return node ? toGraphNodeView(node) : null;
  } finally {
    await session.close();
  }
};

export const getGraphNeighbors = async (
  id: string,
): Promise<{ node: GraphNodeView; network: GraphNetwork }> => {
  const session = neo4jDriver.session({ database: neo4jDatabase });

  try {
    const rootResult = await session.run(
      "MATCH (node {id: $id}) RETURN node LIMIT 1",
      { id },
    );
    const root = rootResult.records[0]?.get("node") as Node | undefined;
    if (!root) {
      throw new Error("GRAPH_NODE_NOT_FOUND");
    }

    const result = await session.run(
      `
        MATCH (from {id: $id})-[relationship]-(to)
        RETURN from, relationship, to
        ORDER BY type(relationship), to.id
      `,
      { id },
    );
    const network = buildNetworkFromRelationshipRecords(result.records);
    const rootView = toGraphNodeView(root);

    if (!network.nodes.some((node) => node.id === rootView.id)) {
      network.nodes.unshift(rootView);
    }

    return { node: rootView, network };
  } finally {
    await session.close();
  }
};

export const getGraphRelationships = async (
  filter: GraphFilter = {},
): Promise<GraphNetwork> => {
  const session = neo4jDriver.session({ database: neo4jDatabase });
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500);

  try {
    const result = await session.run(
      `
        MATCH (from)-[relationship]->(to)
        WHERE ($nodeId IS NULL OR from.id = $nodeId OR to.id = $nodeId)
          AND (size($nodeLabels) = 0
            OR any(label IN labels(from) WHERE label IN $nodeLabels)
            OR any(label IN labels(to) WHERE label IN $nodeLabels))
          AND (size($relationshipTypes) = 0 OR type(relationship) IN $relationshipTypes)
          AND ($sourceDocumentId IS NULL OR relationship.sourceDocumentId = $sourceDocumentId)
        RETURN from, relationship, to
        ORDER BY relationship.evidenceId, type(relationship)
        LIMIT $limit
      `,
      {
        nodeId: filter.nodeId ?? null,
        nodeLabels: filter.nodeLabels ?? [],
        relationshipTypes: filter.relationshipTypes ?? [],
        sourceDocumentId: filter.sourceDocumentId ?? null,
        limit: neo4j.int(limit),
      },
    );

    return buildNetworkFromRelationshipRecords(result.records);
  } finally {
    await session.close();
  }
};

const getRootNetwork = async (
  label: "CASE" | "PERSON",
  id: string,
  depth = 2,
): Promise<GraphNetwork | null> => {
  const session = neo4jDriver.session({ database: neo4jDatabase });
  const boundedDepth = Math.min(Math.max(depth, 1), 3);

  try {
    const rootResult = await session.run(
      `MATCH (root:${label} {id: $id}) RETURN root LIMIT 1`,
      { id },
    );
    const root = rootResult.records[0]?.get("root") as Node | undefined;
    if (!root) return null;

    const nodeResult = await session.run(
      `
        MATCH (root:${label} {id: $id})
        OPTIONAL MATCH (root)-[*1..${boundedDepth}]-(connected)
        WITH collect(DISTINCT root) + collect(DISTINCT connected) AS graphNodes
        UNWIND graphNodes AS graphNode
        RETURN collect(DISTINCT graphNode) AS nodes
      `,
      { id },
    );
    const nodes = (nodeResult.records[0]?.get("nodes") as Node[] | undefined) ?? [root];
    const nodeIds = nodes.map((node) => String(node.properties.id));

    const edgeResult = await session.run(
      `
        MATCH (from)-[relationship]->(to)
        WHERE from.id IN $nodeIds AND to.id IN $nodeIds
        RETURN from, relationship, to
        ORDER BY relationship.evidenceId, type(relationship)
      `,
      { nodeIds },
    );
    const network = buildNetworkFromRelationshipRecords(edgeResult.records);
    const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
    for (const node of nodes) {
      const view = toGraphNodeView(node);
      nodeById.set(view.id, view);
    }

    return {
      nodes: [...nodeById.values()],
      relationships: network.relationships,
    };
  } finally {
    await session.close();
  }
};

export const getCaseNetwork = async (
  caseId: string,
  depth?: number,
): Promise<GraphNetwork | null> => getRootNetwork("CASE", caseId, depth);

export const getPersonNetwork = async (
  personId: string,
  depth?: number,
): Promise<GraphNetwork | null> => getRootNetwork("PERSON", personId, depth);
