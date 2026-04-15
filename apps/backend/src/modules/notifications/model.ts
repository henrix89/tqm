import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

export const notificationScopes = ["SALES", "TECHNICAL", "ADMIN"] as const;
export const notificationTypes = ["customer_note", "customer_activity", "customer_issue"] as const;

const notificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    customerId: { type: Types.ObjectId, ref: "CrmCustomer", required: true, index: true },
    scope: { type: String, enum: notificationScopes, required: true },
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    link: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    createdByUserId: { type: Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "notifications" }
);

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export const NotificationModel =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
