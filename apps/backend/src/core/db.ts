import { Pool } from "pg";
import { config } from "./config";

let pool: Pool | null = null;

export function getDb() {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }
    pool = new Pool({ connectionString: config.databaseUrl });
  }
  return pool;
}

