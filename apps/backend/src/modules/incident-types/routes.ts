import { Router } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../../core/asyncHandler";
import { requireRole } from "../auth/guards";
import { requireAuth } from "../auth/middleware";
import type { AuthenticatedRequest } from "../auth/types";
import { IncidentTypeModel } from "./model";
import { createIncidentTypeSchema, updateIncidentTypeSchema } from "./schemas";

export const router = Router();

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const companyId = req.auth!.role === "superadmin" ? req.query.companyId?.toString() : req.auth!.companyId;
    const filter = companyId ? { companyId: new Types.ObjectId(companyId) } : {};
    const items = await IncidentTypeModel.find(filter).sort({ name: 1 });
    res.json({
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        slug: item.slug,
        description: item.description,
        companyId: String(item.companyId),
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
    const body = createIncidentTypeSchema.parse(req.body);
    const slug = toSlug(body.slug || body.name);
    if (req.auth!.role !== "superadmin" && req.auth!.companyId !== body.companyId) {
      return res.status(403).json({ error: "Cross-company access is not allowed" });
    }
    if (!slug) return res.status(400).json({ error: "Incident type slug cannot be empty" });

    const created = await IncidentTypeModel.create({
      ...body,
      companyId: new Types.ObjectId(body.companyId),
      slug,
    });

    res.status(201).json({
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      description: created.description,
      companyId: String(created.companyId),
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
    const body = updateIncidentTypeSchema.parse(req.body);
    const item = await IncidentTypeModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Incident type not found" });
    if (req.auth!.role !== "superadmin" && String(item.companyId) !== req.auth!.companyId) {
      return res.status(403).json({ error: "Cross-company access is not allowed" });
    }

    if (body.name !== undefined) item.name = body.name;
    if (body.slug !== undefined) item.slug = body.slug.toLowerCase();
    if (body.description !== undefined) item.description = body.description;
    if (body.isActive !== undefined) item.isActive = body.isActive;
    await item.save();

    res.json({
      id: String(item._id),
      name: item.name,
      slug: item.slug,
      description: item.description,
      companyId: String(item.companyId),
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  })
);
