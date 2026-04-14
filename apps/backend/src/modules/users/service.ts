import { Types } from "mongoose";
import { hashPassword, signAuthToken, verifyPassword } from "../auth/utils";
import type { AppRole, AuthUser } from "../auth/types";
import { UserModel, type UserDocument } from "./model";

const roleRank: Record<AppRole, number> = {
  viewer: 1,
  employee: 2,
  manager: 3,
  company_admin: 4,
  superadmin: 5,
};

function toObjectId(value?: string | null) {
  if (!value) return null;
  return new Types.ObjectId(value);
}

function userToAuthPayload(user: UserDocument): AuthUser {
  return {
    userId: String(user._id),
    companyId: String(user.companyId),
    departmentId: user.departmentId ? String(user.departmentId) : null,
    role: user.role as AppRole,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
  };
}

export function sanitizeUser(user: UserDocument) {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
    jobTitle: user.jobTitle,
    departmentId: user.departmentId ? String(user.departmentId) : null,
    companyId: String(user.companyId),
    reportsToUserId: user.reportsToUserId ? String(user.reportsToUserId) : null,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function assertCanManageUser(actor: AuthUser, targetCompanyId: string, targetDepartmentId: string | null) {
  if (actor.role === "superadmin") return;

  if (actor.companyId !== targetCompanyId) {
    throw new Error("Cross-company access is not allowed");
  }

  if (actor.role === "company_admin") return;

  if (actor.role === "manager") {
    if (!actor.departmentId || actor.departmentId !== targetDepartmentId) {
      throw new Error("Manager can only manage users in their own department");
    }
    return;
  }

  throw new Error("Insufficient access");
}

function assertCanAssignRole(actor: AuthUser, targetRole: AppRole) {
  if (actor.role === "superadmin") return;

  if (targetRole === "superadmin") {
    throw new Error("Only superadmin can assign the superadmin role");
  }

  if (actor.role === "company_admin") {
    if (roleRank[targetRole] > roleRank.company_admin) {
      throw new Error("Company administration cannot assign a higher role");
    }
    return;
  }

  if (actor.role === "manager") {
    if (targetRole !== "employee" && targetRole !== "viewer") {
      throw new Error("Department managers can only assign employee or viewer");
    }
    return;
  }

  throw new Error("Insufficient access");
}

function buildUserVisibilityFilter(actor: AuthUser, query: { companyId?: string; departmentId?: string; role?: string; includeInactive?: boolean }) {
  const filter: Record<string, unknown> = {};

  if (!query.includeInactive) {
    filter.isActive = true;
  }

  if (actor.role === "superadmin") {
    if (query.companyId) filter.companyId = toObjectId(query.companyId);
  } else {
    filter.companyId = toObjectId(actor.companyId);
  }

  if (query.departmentId) {
    filter.departmentId = toObjectId(query.departmentId);
  }

  if (query.role) {
    filter.role = query.role;
  }

  if (actor.role === "manager") {
    filter.departmentId = toObjectId(actor.departmentId);
  }

  if (actor.role === "employee" || actor.role === "viewer") {
    filter._id = toObjectId(actor.userId);
  }

  return filter;
}

export async function loginUser(email: string, password: string) {
  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user || !user.isActive) {
    throw new Error("Invalid credentials");
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    throw new Error("Invalid credentials");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAuthToken(userToAuthPayload(user)),
    user: sanitizeUser(user),
    mustChangePassword: user.mustChangePassword,
  };
}

export async function createUser(
  actor: AuthUser,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: AppRole;
    jobTitle?: string;
    departmentId?: string | null;
    companyId: string;
    reportsToUserId?: string | null;
    isActive?: boolean;
    mustChangePassword?: boolean;
  }
) {
  assertCanManageUser(actor, input.companyId, input.departmentId ?? null);
  assertCanAssignRole(actor, input.role);

  const user = await UserModel.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
    jobTitle: input.jobTitle ?? "",
    departmentId: toObjectId(input.departmentId),
    companyId: new Types.ObjectId(input.companyId),
    reportsToUserId: toObjectId(input.reportsToUserId),
    isActive: input.isActive ?? true,
    mustChangePassword: input.mustChangePassword ?? true,
  });

  return sanitizeUser(user);
}

export async function listUsers(actor: AuthUser, query: { companyId?: string; departmentId?: string; role?: string; includeInactive?: boolean }) {
  const filter = buildUserVisibilityFilter(actor, query);
  const users = await UserModel.find(filter).sort({ lastName: 1, firstName: 1 });
  return users.map((user) => sanitizeUser(user));
}

export async function updateUser(
  actor: AuthUser,
  userId: string,
  input: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: AppRole;
    jobTitle?: string;
    departmentId?: string | null;
    companyId?: string;
    reportsToUserId?: string | null;
    isActive?: boolean;
    mustChangePassword?: boolean;
  }
) {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  assertCanManageUser(actor, String(input.companyId ?? user.companyId), input.departmentId ?? (user.departmentId ? String(user.departmentId) : null));
  if (input.role !== undefined) {
    assertCanAssignRole(actor, input.role);
  }

  if (input.firstName !== undefined) user.firstName = input.firstName;
  if (input.lastName !== undefined) user.lastName = input.lastName;
  if (input.email !== undefined) user.email = input.email.toLowerCase();
  if (input.role !== undefined) user.role = input.role;
  if (input.jobTitle !== undefined) user.jobTitle = input.jobTitle;
  if (input.departmentId !== undefined) user.departmentId = toObjectId(input.departmentId);
  if (input.companyId !== undefined) user.companyId = new Types.ObjectId(input.companyId);
  if (input.reportsToUserId !== undefined) user.reportsToUserId = toObjectId(input.reportsToUserId);
  if (input.isActive !== undefined) user.isActive = input.isActive;
  if (input.mustChangePassword !== undefined) user.mustChangePassword = input.mustChangePassword;

  await user.save();
  return sanitizeUser(user);
}

export async function deactivateUser(actor: AuthUser, userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  assertCanManageUser(actor, String(user.companyId), user.departmentId ? String(user.departmentId) : null);

  user.isActive = false;
  await user.save();
  return sanitizeUser(user);
}

export async function getMyProfile(actor: AuthUser) {
  const user = await UserModel.findById(actor.userId);
  return user ? sanitizeUser(user) : null;
}

export async function changeMyPassword(actor: AuthUser, currentPassword: string, newPassword: string) {
  const user = await UserModel.findById(actor.userId);
  if (!user) {
    throw new Error("User not found");
  }

  const passwordOk = await verifyPassword(currentPassword, user.passwordHash);
  if (!passwordOk) {
    throw new Error("Current password is incorrect");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  user.lastLoginAt = new Date();
  await user.save();

  return {
    user: sanitizeUser(user),
    token: signAuthToken(userToAuthPayload(user)),
  };
}

export async function listDirectReports(actor: AuthUser) {
  const user = await UserModel.findById(actor.userId);
  if (!user) return [];

  const reports = await UserModel.find({ reportsToUserId: user._id, isActive: true }).sort({ lastName: 1, firstName: 1 });
  return reports.map((report) => sanitizeUser(report));
}
