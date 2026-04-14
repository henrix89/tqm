import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "./middleware";
import { changePasswordSchema, loginSchema } from "./schemas";
import type { AuthenticatedRequest } from "./types";
import { changeMyPassword, getMyProfile, listDirectReports, loginUser } from "../users/service";

export const router = Router();

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body.email, body.password);
    res.json(result);
  })
);

router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await getMyProfile(req.auth!);
    if (!user) return res.status(404).json({ error: "Profile not found" });
    res.json(user);
  })
);

router.get(
  "/me/reports",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const items = await listDirectReports(req.auth!);
    res.json({ items });
  })
);

router.post(
  "/change-password",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = changePasswordSchema.parse(req.body);
    const result = await changeMyPassword(req.auth!, body.currentPassword, body.newPassword);
    res.json(result);
  })
);
