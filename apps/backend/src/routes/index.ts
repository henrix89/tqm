import { Router } from "express";
import { router as auth } from "../modules/auth/routes";
import { requireAuth, requirePasswordChangeCompleted } from "../modules/auth/middleware";
import { router as companies } from "../modules/companies/routes";
import { router as departments } from "../modules/departments/routes";
import { router as incidentTypes } from "../modules/incident-types/routes";
import { router as incidents } from "../modules/incidents/routes";
import { router as documents } from "../modules/documents/routes";
import { router as surveys } from "../modules/surveys/routes";
import { router as inspections } from "../modules/inspections/routes";
import { router as kpi } from "../modules/kpi/routes";
import { router as users } from "../modules/users/routes";

export const router = Router();

router.use("/auth", auth);
router.use("/companies", companies);
router.use("/departments", departments);
router.use("/incident-types", incidentTypes);
router.use("/users", users);
router.use("/incidents", incidents);
router.use("/documents", requireAuth, requirePasswordChangeCompleted, documents);
router.use("/surveys", requireAuth, requirePasswordChangeCompleted, surveys);
router.use("/inspections", requireAuth, requirePasswordChangeCompleted, inspections);
router.use("/kpi", requireAuth, requirePasswordChangeCompleted, kpi);
