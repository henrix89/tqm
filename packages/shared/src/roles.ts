export type Role = "ADMIN" | "LEDER" | "ANSATT" | "HMS_KS";

export const Roles: Record<Role, Role> = {
  ADMIN: "ADMIN",
  LEDER: "LEDER",
  ANSATT: "ANSATT",
  HMS_KS: "HMS_KS",
};

