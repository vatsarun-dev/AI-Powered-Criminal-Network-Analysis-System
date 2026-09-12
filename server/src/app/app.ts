import express, { type Express } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import caseRoutes from "../modules/case/case.routes.js";
import fileRoutes from "../modules/File/file.routes.js";
import errorHandler from "../middlewares/error.middleware.js";
import securityMiddleware from "../middlewares/security.middleware.js";
import graphRoutes from "../graph/graph.routes.js";
import alertRoutes from "../modules/alert/alert.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";
import mapRoutes from "../modules/map/map.routes.js";
import ragRoutes from "../modules/rag/rag.routes.js";

export default function createApp(): Express {
  const app = express();

  securityMiddleware(app);

  app.use("/api/auth", authRoutes);
  app.use("/api/cases", caseRoutes);
  app.use("/api/uploads", fileRoutes);
  app.use("/api/graph", graphRoutes);
  app.use("/api/alerts", alertRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/map", mapRoutes);
  app.use("/api/rag", ragRoutes);

  app.use(errorHandler);

  return app;
}
