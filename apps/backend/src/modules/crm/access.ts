import { Types } from "mongoose";
import type { AuthUser } from "../auth/types";

function sameId(left?: string | null, right?: string | null) {
  return !!left && !!right && left === right;
}

export function canReadCustomer(
  actor: AuthUser,
  customer: {
    companyId: string;
    departmentId?: string | null;
    ownerUserId: string;
    sharedWithUserIds?: string[];
  }
) {
  if (actor.role === "superadmin") return true;
  if (!sameId(actor.companyId, customer.companyId)) return false;
  if (actor.role === "company_admin") return true;
  if (actor.role === "manager") return sameId(actor.departmentId, customer.departmentId ?? null);

  return sameId(actor.userId, customer.ownerUserId) || (customer.sharedWithUserIds ?? []).includes(actor.userId);
}

export function assertCanWriteCustomer(
  actor: AuthUser,
  customer: {
    companyId: string;
    departmentId?: string | null;
    ownerUserId: string;
    sharedWithUserIds?: string[];
  }
) {
  if (actor.role === "viewer") {
    throw new Error("Read-only access");
  }

  if (actor.role === "superadmin") return;
  if (!sameId(actor.companyId, customer.companyId)) throw new Error("Cross-company access is not allowed");
  if (actor.role === "company_admin") return;
  if (actor.role === "manager") {
    if (!sameId(actor.departmentId, customer.departmentId ?? null)) {
      throw new Error("Department managers can only manage customers in their own department");
    }
    return;
  }

  if (!sameId(actor.userId, customer.ownerUserId)) {
    throw new Error("Employees can only manage their own customers");
  }
}

export function parseObjectId(value?: string | null) {
  if (!value) return null;
  return new Types.ObjectId(value);
}
