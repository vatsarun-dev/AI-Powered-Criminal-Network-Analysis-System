import mongoose from "mongoose";
import env from "./env.js";
import logger from "./logger.js";

export default async function connectDb(): Promise<void> {
  await mongoose.connect(env.DATABASE_URL);
  logger.info("Database connected");
}
