import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

export default async function connectDb(): Promise<void> {
  await mongoose.connect(env.DATABASE_URL);
  logger.info("Database connected");
}
