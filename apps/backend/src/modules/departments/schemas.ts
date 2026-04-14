import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional().default(""),
  companyId: z.string(),
  managerUserId: z.string().nullable().optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  managerUserId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});
