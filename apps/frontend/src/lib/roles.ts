import type { Role } from "./api";

export const roleLabels: Record<Role, string> = {
  viewer: "Kun innsyn",
  employee: "Ansatt",
  manager: "Avdelingsleder",
  company_admin: "Firma Administrasjon",
  superadmin: "Superadmin",
};

export function getAssignableRoles(role: Role): Role[] {
  if (role === "superadmin") {
    return ["viewer", "employee", "manager", "company_admin", "superadmin"];
  }

  if (role === "company_admin") {
    return ["viewer", "employee", "manager", "company_admin"];
  }

  if (role === "manager") {
    return ["viewer", "employee"];
  }

  return [];
}
