import type { Request } from "express";

export const roles = ["superadmin", "company_admin", "manager", "employee", "viewer"] as const;

export type AppRole = (typeof roles)[number];

export type AuthUser = {
  userId: string;
  companyId: string;
  departmentId: string | null;
  role: AppRole;
  mustChangePassword: boolean;
  isActive: boolean;
};

export type AuthenticatedRequest = Request & {
  auth?: AuthUser;
};
