import type { Department } from "./api";

export const coreDepartmentNames = ["Salg", "Teknisk", "Administrasjon"] as const;

function normalizeDepartmentName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function findDepartmentByName(departments: Department[], name: string, companyId?: string) {
  const target = normalizeDepartmentName(name);
  return departments.find((department) => {
    if (companyId && department.companyId !== companyId) return false;
    return normalizeDepartmentName(department.name) === target;
  });
}

export function getMissingCoreDepartmentNames(departments: Department[], companyId?: string) {
  return coreDepartmentNames.filter((name) => !findDepartmentByName(departments, name, companyId));
}
