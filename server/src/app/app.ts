import express, { type Express } from "express";
import authRoutes from "../modules/auth/auth.routes.ts";
import caseRoutes from "../modules/case/case.routes.ts";
import fileRoutes from "../modules/File/file.routes.ts";
import errorHandler from "../middlewares/error.middleware.ts";
import securityMiddleware from "../middlewares/security.middleware.ts";
import graphRoutes from "../graph/graph.routes.js";

export default function createApp(): Express {
  const app = express();

  securityMiddleware(app);

  app.use("/api/auth", authRoutes);
  app.use("/api/cases", caseRoutes);
  app.use("/api/uploads", fileRoutes);
  app.use("/api/graph", graphRoutes);

  app.use(errorHandler);

  return app;
}
