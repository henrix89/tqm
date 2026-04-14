import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./core/config";
import { router as apiV1 } from "./routes";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.use(cors({ origin: config.allowOrigins.length ? config.allowOrigins : true }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/v1", apiV1);

  // Generic error handler (Zod -> 400)
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err?.name === "ZodError") {
      return res.status(400).json({ error: "Validation error", details: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
