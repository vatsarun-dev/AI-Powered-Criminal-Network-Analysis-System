import type { Node } from "neo4j-driver";
import { neo4jDatabase, neo4jDriver } from "../../config/neo4j.js";
import {
  ConflictError,
  NotFoundError,
} from "../../shared/error/globalError.js";
import type { CaseProperties, CaseResponse } from "./case.types.js";

function toCaseResponse(node: Node): CaseResponse {
  return node.properties as CaseResponse;
}

export default class CaseService {
  async create(id: string, properties: CaseProperties): Promise<CaseResponse> {
    const session = neo4jDriver.session({ database: neo4jDatabase });

    try {
      const existing = await session.run(
        "MATCH (c:CASE {id: $id}) RETURN c LIMIT 1",
        { id },
      );

      if (existing.records.length > 0) {
        throw new ConflictError("A case with this id already exists");
      }

      const result = await session.run(
        "CREATE (c:CASE {id: $id}) SET c += $properties RETURN c",
        { id, properties },
      );

      const node = result.records[0]?.get("c") as Node | undefined;
      if (!node) {
        throw new Error("Case creation failed");
      }

      return toCaseResponse(node);
    } finally {
      await session.close();
    }
  }

  async list(): Promise<CaseResponse[]> {
    const session = neo4jDriver.session({ database: neo4jDatabase });

    try {
      const result = await session.run(
        "MATCH (c:CASE) RETURN c ORDER BY c.id",
      );
      return result.records.map((record) =>
        toCaseResponse(record.get("c") as Node),
      );
    } finally {
      await session.close();
    }
  }

  async findById(id: string): Promise<CaseResponse> {
    const session = neo4jDriver.session({ database: neo4jDatabase });

    try {
      const result = await session.run(
        "MATCH (c:CASE {id: $id}) RETURN c LIMIT 1",
        { id },
      );
      const node = result.records[0]?.get("c") as Node | undefined;

      if (!node) {
        throw new NotFoundError("Case not found");
      }

      return toCaseResponse(node);
    } finally {
      await session.close();
    }
  }

  async update(id: string, properties: CaseProperties): Promise<CaseResponse> {
    const session = neo4jDriver.session({ database: neo4jDatabase });

    try {
      const result = await session.run(
        "MATCH (c:CASE {id: $id}) SET c += $properties RETURN c",
        { id, properties },
      );
      const node = result.records[0]?.get("c") as Node | undefined;

      if (!node) {
        throw new NotFoundError("Case not found");
      }

      return toCaseResponse(node);
    } finally {
      await session.close();
    }
  }
}
