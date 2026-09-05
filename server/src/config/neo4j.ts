import "dotenv/config";
import neo4j from "neo4j-driver";

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE || "neo4j";

if (!uri || !username || !password) {
  throw new Error("Neo4j environment variables are missing");
}

export const neo4jDriver = neo4j.driver(
  uri,
  neo4j.auth.basic(username, password)
);

export const neo4jDatabase = database;