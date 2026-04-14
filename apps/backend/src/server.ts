import { createApp } from "./app";
import { config } from "./core/config";
import { logger } from "./core/logger";
import { connectMongo } from "./core/mongo";

async function bootstrap() {
  await connectMongo();
  const app = createApp();
  app.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to start API", error);
  process.exit(1);
});
