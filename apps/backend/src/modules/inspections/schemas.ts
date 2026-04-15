import { z } from "zod";
import { findingSeverities } from "./models";

export const createInspectionSchema = z.object({
  title: z.string().min(1),
  location: z.string().optional().default(""),
  departmentId: z.string().nullable().optional(),
  plannedFor: z.string().min(1),
});

export const createFindingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  severity: z.enum(findingSeverities).optional().default("LOW"),
  assigneeUserId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});
