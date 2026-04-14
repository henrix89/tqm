import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../auth/middleware";
import { createUserSchema, updateUserSchema, userListQuerySchema } from "../auth/schemas";
import type { AuthenticatedRequest } from "../auth/types";
import {
  createUser,
  deactivateUser,
  getMyProfile,
  listDirectReports,
  listUsers,
  updateUser,
} from "./service";

export const router = Router();

router.use(requireAuth);

router.post(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = createUserSchema.parse(req.body);
    const user = await createUser(req.auth!, body);
    res.status(201).json(user);
  })
);

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const query = userListQuerySchema.parse(req.query);
    const users = await listUsers(req.auth!, query);
    res.json({ items: users });
  })
);

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

router.patch(
  "/:id",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const body = updateUserSchema.parse(req.body);
    const user = await updateUser(req.auth!, req.params.id, body);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  })
);

router.post(
  "/:id/deactivate",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const user = await deactivateUser(req.auth!, req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  })
);
