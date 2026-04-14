import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});
