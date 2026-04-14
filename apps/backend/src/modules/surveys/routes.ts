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

router.get("/:id/questions", (_req, res) => {
  res.json({ items: [] });
});
router.post("/:id/questions", (_req, res) => {
  res.status(201).json({ id: "todo" });
});

router.post("/:id/publish", (_req, res) => {
  res.json({ ok: true });
});

// Public submit by link
router.post("/:id/submit", (_req, res) => {
  res.status(201).json({ ok: true });
});

