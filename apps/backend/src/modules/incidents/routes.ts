import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth, requirePasswordChangeCompleted } from "../auth/middleware";
import { IncidentCreateSchema, IncidentListQuerySchema, IncidentUpdateSchema } from "./schemas";
import {
  serviceAddComment,
  serviceCreateIncident,
  serviceGetIncident,
  serviceListComments,
  serviceListIncidents,
  serviceUpdateIncident,
} from "./service";

export const router = Router();

router.use(requireAuth);

// List incidents
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = IncidentListQuerySchema.parse(req.query);
    const result = await serviceListIncidents(query);
    res.json(result);
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
    res.json(one);
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
