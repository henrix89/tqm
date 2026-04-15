import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthenticatedRequest } from "../auth/types";
import { serviceCreateIncident } from "../incidents/service";
import { InspectionModel } from "./models";
import { createFindingSchema, createInspectionSchema } from "./schemas";

export const router = Router();

function mapInspection(item: any) {
  return {
    id: String(item._id),
    title: item.title,
    location: item.location,
    departmentId: item.departmentId,
    companyId: item.companyId,
    plannedFor: item.plannedFor,
    status: item.status,
    createdBy: item.createdBy,
    findingCount: item.findings?.length ?? 0,
    openFindingCount: (item.findings ?? []).filter((finding: any) => finding.status !== "DONE").length,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapFinding(item: any) {
  return {
    id: String(item._id),
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: item.status,
    assigneeUserId: item.assigneeUserId,
    dueDate: item.dueDate,
    incidentId: item.incidentId,
  };
}

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const filter: Record<string, unknown> =
      actor.role === "superadmin" ? {} : { companyId: actor.companyId };

    if (actor.role === "manager") {
      filter.departmentId = actor.departmentId;
    }

    const items = await InspectionModel.find(filter).sort({ plannedFor: 1, createdAt: -1 });
    res.json({ items: items.map(mapInspection) });
  })
);

router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const body = createInspectionSchema.parse(req.body);

    const created = await InspectionModel.create({
      title: body.title,
      location: body.location,
      departmentId: actor.role === "manager" ? actor.departmentId : body.departmentId ?? null,
      companyId: actor.companyId,
      plannedFor: new Date(body.plannedFor),
      createdBy: actor.userId,
      findings: [],
    });

    res.status(201).json(mapInspection(created));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await InspectionModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });

    res.json({
      ...mapInspection(item),
      findings: (item.findings ?? []).map(mapFinding),
    });
  })
);

router.get(
  "/:id/findings",
  asyncHandler(async (req, res) => {
    const item = await InspectionModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });

    res.json({ items: (item.findings ?? []).map(mapFinding) });
  })
);

router.post(
  "/:id/findings",
  asyncHandler(async (req, res) => {
    const body = createFindingSchema.parse(req.body);
    const item = await InspectionModel.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });

    item.findings.push({
      title: body.title,
      description: body.description,
      severity: body.severity,
      assigneeUserId: body.assigneeUserId ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    } as any);
    await item.save();

    const finding = item.findings[item.findings.length - 1] as any;
    res.status(201).json(mapFinding(finding));
  })
);

router.post(
  "/findings/:findingId/create-incident",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const inspections = await InspectionModel.find({ "findings._id": req.params.findingId });
    const inspection = inspections.find((item) =>
      (item.findings ?? []).some((finding: any) => String(finding._id) === req.params.findingId)
    );

    if (!inspection) return res.status(404).json({ error: "Finding not found" });

    const finding = (inspection.findings ?? []).find((item: any) => String(item._id) === req.params.findingId) as any;
    if (!finding) return res.status(404).json({ error: "Finding not found" });

    if (finding.incidentId) {
      return res.status(400).json({ error: "Incident already created", incidentId: finding.incidentId });
    }

    const severityMap: Record<string, string> = {
      LOW: "LAV",
      MEDIUM: "MIDDELS",
      HIGH: "HØY",
      CRITICAL: "KRITISK",
    };

    const created = await serviceCreateIncident({
      title: finding.title,
      description: finding.description || `Opprettet fra vernerunde: ${inspection.title}`,
      date: new Date().toISOString().slice(0, 10),
      category: "HMS",
      severity: severityMap[finding.severity] as any,
      assigneeUserId: finding.assigneeUserId ?? null,
      measures: null,
      dueDate: finding.dueDate ? new Date(finding.dueDate).toISOString().slice(0, 10) : null,
      createdBy: actor.userId,
    });

    finding.incidentId = created.id;
    finding.status = "IN_PROGRESS";
    await inspection.save();

    res.status(201).json({ incidentId: created.id });
  })
);
