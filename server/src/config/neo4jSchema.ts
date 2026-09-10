// Compatibility export for older callers. The graph module owns the single
// authoritative, additive Neo4j schema definition.
export { initializeGraphSchema as initializeNeo4jSchema } from "../modules/graph/graph.schema.js";
