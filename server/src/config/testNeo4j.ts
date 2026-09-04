import "dotenv/config";
import { neo4jDriver, neo4jDatabase } from "./neo4j.js";

const testNeo4j = async () => {
  const session = neo4jDriver.session({
    database: neo4jDatabase,
  });

  try {
    const result = await session.run("RETURN 1 AS result");

    const record = result.records[0];
    if (!record) {
      throw new Error("Neo4j returned no result");
    }

    console.log("Neo4j connected:", record.get("result").toNumber());
  } catch (error) {
    console.error("Neo4j connection failed:", error);
  } finally {
    await session.close();
    await neo4jDriver.close();
  }
};

testNeo4j();