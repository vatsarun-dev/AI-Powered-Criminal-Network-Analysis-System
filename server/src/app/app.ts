import express, { type Express } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import fileRoutes from "../modules/File/file.routes.js";
import errorHandler from "../middlewares/error.middleware.js";
import securityMiddleware from "../middlewares/security.middleware.js";
import graphRoutes from "../graph/graph.routes.js";

export default function createApp(): Express {
  const app = express();

  securityMiddleware(app);

  app.use("/api/auth", authRoutes);
  app.use("/api/uploads", fileRoutes);
  app.use("/api/graph", graphRoutes);

  app.use(errorHandler);

  return app;
}
