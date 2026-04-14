import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireRole } from "../auth/guards";
import { requireAuth } from "../auth/middleware";
import type { AuthenticatedRequest } from "../auth/types";
import { CompanyModel } from "./model";
import { createCompanySchema, updateCompanySchema } from "./schemas";

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
    const filter = req.auth!.role === "superadmin" ? {} : { _id: req.auth!.companyId };
    const items = await CompanyModel.find(filter).sort({ name: 1 });
    res.json({
      items: items.map((item) => ({
        id: String(item._id),
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
    });
  })
);

router.post(
  "/",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    const body = createCompanySchema.parse(req.body);
    const slug = toSlug(body.slug || body.name);
    if (!slug) return res.status(400).json({ error: "Company slug cannot be empty" });
    const created = await CompanyModel.create({
      name: body.name,
      slug,
      isActive: true,
    });
    res.status(201).json({
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      isActive: created.isActive,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  })
);

router.patch(
  "/:id",
  requireRole("superadmin"),
  asyncHandler(async (req, res) => {
    const body = updateCompanySchema.parse(req.body);
    const item = await CompanyModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Company not found" });
    if (body.name !== undefined) item.name = body.name;
    if (body.slug !== undefined) item.slug = body.slug.toLowerCase();
    if (body.isActive !== undefined) item.isActive = body.isActive;
    await item.save();
    res.json({
      id: String(item._id),
      name: item.name,
      slug: item.slug,
      isActive: item.isActive,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  })
);
