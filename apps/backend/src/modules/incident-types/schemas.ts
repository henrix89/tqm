import { z } from "zod";

export const createIncidentTypeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional().default(""),
  companyId: z.string(),
});

export const updateIncidentTypeSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});
