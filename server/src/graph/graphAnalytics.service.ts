import { randomUUID } from "node:crypto";

import { neo4jDriver, neo4jDatabase } from "../config/neo4j.js";
import neo4j from "neo4j-driver";

const boundedLimit = (limit: number): number => Math.min(Math.max(limit, 1), 100);

export const getDegreeCentrality = async (limit = 50) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]-()
      RETURN
        n.id AS id,
        labels(n) AS labels,
        n.name AS name,
        count(r) AS degree
      ORDER BY degree DESC
      LIMIT $limit
    `;

    const result = await session.run(query, { limit: neo4j.int(boundedLimit(limit)) });

    return result.records.map((record) => ({
      id: record.get("id"),
      labels: record.get("labels"),
      name: record.get("name"),
      degree: record.get("degree").toNumber(),
    }));
  } finally {
    await session.close();
  }
};

export const getBetweennessCentrality = async (limit = 50) => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const query = `
      MATCH (n)
      WITH collect(n) AS nodes

      UNWIND nodes AS source
      UNWIND nodes AS target

      WITH source, target
      WHERE source <> target

      MATCH path = shortestPath((source)-[*]-(target))

      WITH source, target, path
      UNWIND nodes(path)[1..-1] AS middle

      RETURN
        middle.id AS id,
        labels(middle) AS labels,
        middle.name AS name,
        count(*) AS betweenness
      ORDER BY betweenness DESC
      LIMIT $limit
    `;

    const result = await session.run(query, { limit: neo4j.int(boundedLimit(limit)) });

    return result.records.map((record) => ({
      id: record.get("id"),
      labels: record.get("labels"),
      name: record.get("name"),
      betweenness: record.get("betweenness").toNumber(),
    }));
  } finally {
    await session.close();
  }
};
export const getLouvainCommunities = async () => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });
  const graphName = `criminal-network-${randomUUID()}`;
  let projected = false;

  try {
    // A uniquely named, in-memory GDS projection avoids touching a projection
    // created by another request or user. It is removed in the finally block.
    const projectQuery = `
      CALL gds.graph.project(
        $graphName,
        '*',
        '*',
        {
          memory: '2GB',
          ttl: 'PT30M'
        }
      )
      YIELD graphName, nodeCount, relationshipCount

      RETURN graphName, nodeCount, relationshipCount
    `;

    await session.run(projectQuery, { graphName });
    projected = true;

    // Run Louvain
    const louvainQuery = `
      CALL gds.louvain.stream($graphName)
      YIELD nodeId, communityId

      RETURN nodeId, communityId
      ORDER BY communityId
    `;

    const result = await session.run(louvainQuery, { graphName });

    const results = result.records.map((record) => ({
      nodeId: record.get("nodeId").toNumber(),
      communityId: record.get("communityId").toNumber(),
    }));

    return results;
  } finally {
    if (projected) {
      await session.run(
        `
          CALL gds.graph.drop($graphName, false)
          YIELD graphName
          RETURN graphName
        `,
        { graphName },
      );
    }
    await session.close();
  }
};
