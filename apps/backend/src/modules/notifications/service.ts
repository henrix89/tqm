import { Types } from "mongoose";
import { UserModel } from "../users/model";
import { NotificationModel } from "./model";

type RecipientAssignment = {
  scope: string;
  departmentId?: string | null;
  userIds?: string[];
};

type CustomerRouting = {
  id: string;
  companyId: string;
  name: string;
  responsibilityAssignments?: RecipientAssignment[];
};

type CreateCustomerNotificationInput = {
  actorUserId: string;
  customer: CustomerRouting;
  scope: "SALES" | "TECHNICAL" | "ADMIN";
  type: "customer_note" | "customer_activity" | "customer_issue";
  title: string;
  message: string;
};

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function createCustomerNotifications(input: CreateCustomerNotificationInput) {
  const recipients = new Set<string>();
  const assignments = (input.customer.responsibilityAssignments ?? []).filter((item) => item.scope === input.scope);

  for (const assignment of assignments) {
    for (const userId of assignment.userIds ?? []) {
      recipients.add(userId);
    }

    if ((assignment.userIds?.length ?? 0) === 0 && assignment.departmentId) {
      const departmentUsers = await UserModel.find({
        companyId: new Types.ObjectId(input.customer.companyId),
        departmentId: new Types.ObjectId(assignment.departmentId),
        isActive: true,
      }).select({ _id: 1 });

      for (const user of departmentUsers) {
        recipients.add(String(user._id));
      }
    }
  }

  const filteredRecipients = dedupe(Array.from(recipients)).filter((userId) => userId !== input.actorUserId);
  if (filteredRecipients.length === 0) return [];

  const created = await NotificationModel.insertMany(
    filteredRecipients.map((userId) => ({
      userId: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(input.customer.companyId),
      customerId: new Types.ObjectId(input.customer.id),
      scope: input.scope,
      type: input.type,
      title: input.title,
      message: input.message,
      link: `/crm/customers?customerId=${input.customer.id}`,
      isRead: false,
      createdByUserId: new Types.ObjectId(input.actorUserId),
    }))
  );

  return created;
}

export async function listNotificationsForUser(userId: string) {
  const items = await NotificationModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(20);
  const unreadCount = await NotificationModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });
  return { items, unreadCount };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return NotificationModel.findOneAndUpdate(
    { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  );
}

export async function markAllNotificationsRead(userId: string) {
  await NotificationModel.updateMany(
    { userId: new Types.ObjectId(userId), isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
}
