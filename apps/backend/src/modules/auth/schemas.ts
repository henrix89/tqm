import { z } from "zod";
import { roles } from "./types";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles),
  jobTitle: z.string().optional().default(""),
  departmentId: z.string().nullable().optional(),
  companyId: z.string(),
  reportsToUserId: z.string().nullable().optional(),
  isActive: z.boolean().optional().default(true),
  mustChangePassword: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(roles).optional(),
  jobTitle: z.string().optional(),
  departmentId: z.string().nullable().optional(),
  companyId: z.string().optional(),
  reportsToUserId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
});

export const userListQuerySchema = z.object({
  companyId: z.string().optional(),
  departmentId: z.string().optional(),
  role: z.enum(roles).optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
});
