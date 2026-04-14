import { Router } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../../core/asyncHandler";
import { requireRole } from "../auth/guards";
import { requireAuth } from "../auth/middleware";
import type { AuthenticatedRequest } from "../auth/types";
import { DepartmentModel } from "./model";
import { createDepartmentSchema, updateDepartmentSchema } from "./schemas";

export const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const companyId = req.auth!.role === "superadmin" ? req.query.companyId?.toString() : req.auth!.companyId;
    const filter = companyId ? { companyId: new Types.ObjectId(companyId), isActive: true } : { isActive: true };
    const items = await DepartmentModel.find(filter).sort({ name: 1 });
    res.json({
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        code: item.code,
        companyId: String(item.companyId),
        managerUserId: item.managerUserId ? String(item.managerUserId) : null,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  })
);

router.post(
  "/",
  requireRole("company_admin"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = createDepartmentSchema.parse(req.body);
    if (req.auth!.role !== "superadmin" && req.auth!.companyId !== body.companyId) {
      return res.status(403).json({ error: "Cross-company access is not allowed" });
    }
    const created = await DepartmentModel.create({
      name: body.name,
      code: body.code,
      companyId: new Types.ObjectId(body.companyId),
      managerUserId: body.managerUserId ? new Types.ObjectId(body.managerUserId) : null,
      isActive: true,
    });
    res.status(201).json({
      id: String(created._id),
      name: created.name,
      code: created.code,
      companyId: String(created.companyId),
      managerUserId: created.managerUserId ? String(created.managerUserId) : null,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  })
);

router.patch(
  "/:id",
  requireRole("company_admin"),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = updateDepartmentSchema.parse(req.body);
    const item = await DepartmentModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Department not found" });
    if (req.auth!.role !== "superadmin" && String(item.companyId) !== req.auth!.companyId) {
      return res.status(403).json({ error: "Cross-company access is not allowed" });
    }
    if (body.name !== undefined) item.name = body.name;
    if (body.code !== undefined) item.code = body.code;
    if (body.managerUserId !== undefined) item.managerUserId = body.managerUserId ? new Types.ObjectId(body.managerUserId) : null;
    if (body.isActive !== undefined) item.isActive = body.isActive;
    await item.save();
    res.json({
      id: String(item._id),
      name: item.name,
      code: item.code,
      companyId: String(item.companyId),
      managerUserId: item.managerUserId ? String(item.managerUserId) : null,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  })
);
