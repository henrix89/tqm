import type { NextFunction, Response } from "express";
import { verifyAuthToken } from "./utils";
import type { AuthenticatedRequest } from "./types";

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const token = header.slice("Bearer ".length);
    req.auth = verifyAuthToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requirePasswordChangeCompleted(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.auth.mustChangePassword) {
    return res.status(403).json({ error: "Password change required" });
  }

  return next();
}
