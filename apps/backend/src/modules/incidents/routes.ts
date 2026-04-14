import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth, requirePasswordChangeCompleted } from "../auth/middleware";
import { IncidentCreateSchema, IncidentListQuerySchema, IncidentUpdateSchema } from "./schemas";
import { createFileAsset, listAttachmentCounts, listAttachmentsForEntity } from "../files/service";
import {
  serviceAddComment,
  serviceCreateIncident,
  serviceGetIncident,
  serviceListComments,
  serviceListIncidents,
  serviceUpdateIncident,
} from "./service";

export const router = Router();

const attachmentUploadSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().min(1),
        contentType: z.string().optional().default("application/octet-stream"),
        dataBase64: z.string().min(1),
      })
    )
    .min(1),
});

router.use(requireAuth);

// List incidents
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = IncidentListQuerySchema.parse(req.query);
    const result = await serviceListIncidents(query);
    const counts = await listAttachmentCounts(
      "incident",
      result.items.map((item) => item.id)
    );

    res.json({
      ...result,
      items: result.items.map((item) => ({
        ...item,
        attachmentCount: counts.get(item.id) ?? 0,
      })),
    });
  })
);

// Create incident
router.post(
  "/",
  requirePasswordChangeCompleted,
  asyncHandler(async (req, res) => {
    const body = IncidentCreateSchema.parse(req.body);
    const createdBy = (req as any).auth?.userId ?? req.header("x-user-id");
    if (!createdBy) return res.status(400).json({ error: "Missing x-user-id header" });
    const created = await serviceCreateIncident({ ...body, createdBy });
    res.status(201).json(created);
  })
);

// Get by id
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const one = await serviceGetIncident(req.params.id);
    if (!one) return res.status(404).json({ error: "Not found" });
    const attachments = await listAttachmentsForEntity("incident", req.params.id);
    res.json({
      ...one,
      attachments,
      attachmentCount: attachments.length,
    });
  })
);

// Update
router.put(
  "/:id",
  requirePasswordChangeCompleted,
  asyncHandler(async (req, res) => {
    const body = IncidentUpdateSchema.parse(req.body);
    const changedBy = (req as any).auth?.userId ?? req.header("x-user-id");
    if (!changedBy) return res.status(400).json({ error: "Missing x-user-id header" });
    const updated = await serviceUpdateIncident(req.params.id, body, changedBy);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  })
);

// Comments
router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const items = await serviceListComments(req.params.id);
    res.json({ items });
  })
);
router.post(
  "/:id/comments",
  requirePasswordChangeCompleted,
  asyncHandler(async (req, res) => {
    const body = String((req.body?.body ?? "")).trim();
    if (!body) return res.status(400).json({ error: "Missing body" });
    const userId = (req as any).auth?.userId ?? req.header("x-user-id");
    if (!userId) return res.status(400).json({ error: "Missing x-user-id header" });
    const created = await serviceAddComment(req.params.id, userId, body);
    res.status(201).json(created);
  })
);

router.get(
  "/:id/attachments",
  asyncHandler(async (req, res) => {
    const items = await listAttachmentsForEntity("incident", req.params.id);
    res.json({ items });
  })
);

router.post(
  "/:id/attachments",
  requirePasswordChangeCompleted,
  asyncHandler(async (req, res) => {
    const incident = await serviceGetIncident(req.params.id);
    if (!incident) return res.status(404).json({ error: "Not found" });

    const body = attachmentUploadSchema.parse(req.body);
    const userId = (req as any).auth?.userId ?? req.header("x-user-id");
    const companyId = (req as any).auth?.companyId;
    if (!userId || !companyId) return res.status(400).json({ error: "Missing auth context" });

    const created = await Promise.all(
      body.files.map((file) =>
        createFileAsset({
          kind: "incident",
          entityId: req.params.id,
          companyId,
          fileName: file.fileName,
          contentType: file.contentType,
          dataBase64: file.dataBase64,
          uploadedBy: userId,
        })
      )
    );

    res.status(201).json({ items: created });
  })
);
