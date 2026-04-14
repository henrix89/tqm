import { z } from "zod";

export const IncidentCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(["HMS", "LEVERANSE", "TEKNISK", "KUNDE", "INTERN_PROSESS"]),
  severity: z.enum(["LAV", "MIDDELS", "HØY", "KRITISK"]),
  assigneeUserId: z.string().uuid().nullable().optional(),
  measures: z.string().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});

export const IncidentUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.enum(["HMS", "LEVERANSE", "TEKNISK", "KUNDE", "INTERN_PROSESS"]).optional(),
  severity: z.enum(["LAV", "MIDDELS", "HØY", "KRITISK"]).optional(),
  assigneeUserId: z.string().uuid().nullable().optional(),
  measures: z.string().nullable().optional(),
  status: z.enum(["ÅPEN", "PÅGÅR", "LUKKET", "AVVIST"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  closedAt: z.string().datetime().nullable().optional(),
});

export const IncidentListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["ÅPEN", "PÅGÅR", "LUKKET", "AVVIST"]).optional(),
  category: z.enum(["HMS", "LEVERANSE", "TEKNISK", "KUNDE", "INTERN_PROSESS"]).optional(),
  severity: z.enum(["LAV", "MIDDELS", "HØY", "KRITISK"]).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().gte(1).default(1).optional(),
  pageSize: z.coerce.number().int().gte(1).lte(100).default(20).optional(),
});

export type IncidentCreateInput = z.infer<typeof IncidentCreateSchema>;
export type IncidentUpdateInput = z.infer<typeof IncidentUpdateSchema>;
export type IncidentListQueryInput = z.infer<typeof IncidentListQuerySchema>;

