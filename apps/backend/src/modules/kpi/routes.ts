import { Router } from "express";

export const router = Router();

// KPI endpoints return computed aggregates; placeholder values for now
router.get("/overview", (_req, res) => {
  res.json({
    openIncidents: 0,
    closedLast30Days: 0,
    avgCloseDays: 0,
    inspectionsCount: 0,
    surveyScore: 0,
  });
});

