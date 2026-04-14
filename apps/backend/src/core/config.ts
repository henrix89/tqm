import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "",
  mongoUrl: process.env.MONGO_URL ?? "",
  uploadDir: process.env.UPLOAD_DIR ?? path.resolve(__dirname, "../../../../uploads"),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  allowOrigins: (process.env.ALLOW_ORIGINS ?? "").split(",").filter(Boolean),
};
