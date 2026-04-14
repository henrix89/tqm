import { Router } from "express";

export const router = Router();

router.get("/", (_req, res) => {
  res.json({ items: [], total: 0 });
});
router.post("/", (_req, res) => {
  res.status(201).json({ id: "todo" });
});

router.get("/:id", (_req, res) => {
  res.json({ id: "todo" });
});

router.get("/:id/findings", (_req, res) => {
  res.json({ items: [] });
});
router.post("/:id/findings", (_req, res) => {
  res.status(201).json({ id: "todo" });
});

router.post("/findings/:findingId/create-incident", (_req, res) => {
  res.status(201).json({ incidentId: "todo" });
});

