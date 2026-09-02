import createApp from "./app/app.js";
import connectDb from "./config/database.js";
import env from "./config/env.js";
import logger from "./config/logger.js";

async function startServer(): Promise<void> {
  try {
    await connectDb();

    const app = createApp();
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, "API server is running");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start API server");
    process.exit(1);
  }
}

void startServer();
