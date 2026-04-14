import type { Response, NextFunction } from "express";
import type { AppRole, AuthenticatedRequest } from "./types";

const roleRank: Record<AppRole, number> = {
  viewer: 1,
  employee: 2,
  manager: 3,
  company_admin: 4,
  superadmin: 5,
};

export function requireRole(minimumRole: AppRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (roleRank[req.auth.role] < roleRank[minimumRole]) {
      return res.status(403).json({ error: "Insufficient access" });
    }

    return next();
  };
}

export function requireReadOnlyAllowed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  return next();
}
