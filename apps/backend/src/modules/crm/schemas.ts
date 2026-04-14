import { z } from "zod";
import { activityTypes, customerStatuses, issueSeverities, issueStatuses } from "./models";

export const customerListQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(customerStatuses).optional(),
  ownerUserId: z.string().optional(),
  companyId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  organizationNumber: z.string().optional().default(""),
  industry: z.string().optional().default(""),
  status: z.enum(customerStatuses).optional().default("PROSPEKT"),
  address: z.string().optional().default(""),
  website: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  ownerUserId: z.string().optional(),
  companyId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  sharedWithUserIds: z.array(z.string()).optional().default([]),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  organizationNumber: z.string().optional(),
  industry: z.string().optional(),
  status: z.enum(customerStatuses).optional(),
  address: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  ownerUserId: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  sharedWithUserIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")).default(""),
  phone: z.string().optional().default(""),
  jobTitle: z.string().optional().default(""),
  isPrimary: z.boolean().optional().default(false),
});

export const createActivitySchema = z.object({
  type: z.enum(activityTypes),
  date: z.string().min(1),
  summary: z.string().min(1),
  details: z.string().optional().default(""),
  contactId: z.string().nullable().optional(),
  ownerUserId: z.string().optional(),
});

export const createNoteSchema = z.object({
  body: z.string().min(1),
});

export const createIssueSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  category: z.string().optional().default(""),
  severity: z.enum(issueSeverities).optional().default("LAV"),
  status: z.enum(issueStatuses).optional().default("APEN"),
  dueDate: z.string().nullable().optional(),
  ownerUserId: z.string().nullable().optional(),
});
