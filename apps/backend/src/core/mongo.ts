import mongoose from "mongoose";
import { config } from "./config";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectMongo() {
  if (!config.mongoUrl) {
    throw new Error("MONGO_URL is not configured");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(config.mongoUrl);
  }

  return connectionPromise;
}
