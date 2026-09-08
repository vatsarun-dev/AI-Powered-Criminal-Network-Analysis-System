import {
  neo4jDriver,
  neo4jDatabase,
} from "../config/neo4j.js";

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
      nodes: record.get("nodes"),
      relationships: record.get("relationships"),
      hops: record.get("hops").toNumber(),
    };
  } finally {
    await session.close();
  }
};