import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import type { AuthenticatedRequest } from "../auth/types";
import { listNotificationsForUser, markAllNotificationsRead, markNotificationRead } from "./service";

export const router = Router();

function mapNotification(item: any) {
  return {
    id: String(item._id),
    userId: String(item.userId),
    companyId: String(item.companyId),
    customerId: String(item.customerId),
    scope: item.scope,
    type: item.type,
    title: item.title,
    message: item.message,
    link: item.link,
    isRead: item.isRead,
    createdByUserId: String(item.createdByUserId),
    readAt: item.readAt,
    createdAt: item.createdAt,
  };
}

router.get(
  "/",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const result = await listNotificationsForUser(actor.userId);
    res.json({ items: result.items.map(mapNotification), unreadCount: result.unreadCount });
  })
);

router.post(
  "/:id/read",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    const item = await markNotificationRead(actor.userId, req.params.id);
    if (!item) return res.status(404).json({ error: "Notification not found" });
    res.json(mapNotification(item));
  })
);

router.post(
  "/read-all",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const actor = req.auth!;
    await markAllNotificationsRead(actor.userId);
    res.json({ ok: true });
  })
);
