import { initializeGraphSchema } from "./graph.schema.js";
import { neo4jDriver } from "../config/neo4j.js";

const init = async () => {
  try {
    await initializeGraphSchema();

    console.log("Neo4j setup completed.");
  } catch (error) {
    console.error("Neo4j setup failed:", error);
    process.exit(1);
  } finally {
    await neo4jDriver.close();
  }
};

init();