import { initializeGraphSchema } from "./graph.schema.js";
import { neo4jDriver } from "../../config/neo4j.js";

const init = async (): Promise<void> => {
  try {
    await initializeGraphSchema();
    console.log("Neo4j setup completed.");
  } catch (error) {
    console.error("Neo4j setup failed:", error);
    process.exitCode = 1; // prefer this over process.exit() so `finally` always runs
  } finally {
    await neo4jDriver.close();
  }
};

init();