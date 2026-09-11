import type { RequestHandler } from "express";
import mongoose from "mongoose";

import { neo4jDatabase, neo4jDriver } from "../config/neo4j.js";

/** Reports service availability without disclosing configuration or credentials. */
export const healthCheck: RequestHandler = async (_req, res) => {
  const mongoConnected = mongoose.connection.readyState === mongoose.ConnectionStates.connected;

  try {
    await neo4jDriver.getServerInfo();
    const session = neo4jDriver.session({ database: neo4jDatabase });
    try {
      await session.run("RETURN 1 AS ok");
    } finally {
      await session.close();
    }

    res.status(mongoConnected ? 200 : 503).json({
      success: mongoConnected,
      data: {
        api: "connected",
        mongodb: mongoConnected ? "connected" : "unavailable",
        neo4j: "connected",
      },
    });
  } catch {
    res.status(503).json({
      success: false,
      data: {
        api: "connected",
        mongodb: mongoConnected ? "connected" : "unavailable",
        neo4j: "unavailable",
      },
    });
  }
};
