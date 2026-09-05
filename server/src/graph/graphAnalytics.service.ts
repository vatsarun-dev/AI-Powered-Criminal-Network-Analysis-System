import {
  neo4jDriver,
  neo4jDatabase,
} from "../config/neo4j.js";

export const getDegreeCentrality = async () => {
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
    `;

    const result = await session.run(query);

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

export const getBetweennessCentrality = async () => {
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
    `;

    const result = await session.run(query);

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

  try {
    const query = `
      MATCH (source)
      OPTIONAL MATCH (source)-[r]-(target)

      RETURN gds.graph.project(
        'criminal-network',
        source,
        target,
        {
          sourceNodeProperties: source { .id },
          targetNodeProperties: target { .id },
          relationshipType: type(r)
        },
        {
          memory: '2GB'
        }
      )
    `;

    await session.run(query);

    const result = await session.run(`
      CALL gds.louvain.stream('criminal-network')
      YIELD nodeId, communityId

      RETURN
        nodeId,
        communityId
      ORDER BY communityId
    `);

    return result.records.map((record) => ({
      nodeId: record.get("nodeId").toNumber(),
      communityId: record.get("communityId").toNumber(),
    }));
  } finally {
    await session.close();
  }
};