import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

export const customerStatuses = ["PROSPEKT", "AKTIV", "INAKTIV"] as const;
export const activityTypes = ["BESOK", "TELEFON", "EPOST", "MOTE", "OPPFOLGING"] as const;
export const issueStatuses = ["APEN", "PAGAR", "LUKKET"] as const;
export const issueSeverities = ["LAV", "MIDDELS", "HOY", "KRITISK"] as const;
export const responsibilityScopes = ["SALES", "TECHNICAL", "ADMIN"] as const;

const responsibilityAssignmentSchema = new Schema(
  {
    scope: { type: String, enum: responsibilityScopes, required: true },
    departmentId: { type: Types.ObjectId, ref: "Department", default: null },
    userIds: { type: [{ type: Types.ObjectId, ref: "User" }], default: [] },
  },
  { _id: false }
);

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    organizationNumber: { type: String, default: "", trim: true },
    industry: { type: String, default: "", trim: true },
    status: { type: String, enum: customerStatuses, default: "PROSPEKT" },
    address: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    ownerUserId: { type: Types.ObjectId, ref: "User", required: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true },
    departmentId: { type: Types.ObjectId, ref: "Department", default: null },
    sharedWithUserIds: { type: [{ type: Types.ObjectId, ref: "User" }], default: [] },
    responsibilityAssignments: { type: [responsibilityAssignmentSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "crm_customers" }
);

const contactSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "CrmCustomer", required: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    jobTitle: { type: String, default: "", trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "crm_contacts" }
);

const activitySchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "CrmCustomer", required: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true },
    contactId: { type: Types.ObjectId, ref: "CrmContact", default: null },
    type: { type: String, enum: activityTypes, required: true },
    date: { type: Date, required: true },
    summary: { type: String, required: true, trim: true },
    details: { type: String, default: "", trim: true },
    ownerUserId: { type: Types.ObjectId, ref: "User", required: true },
    notificationScope: { type: String, enum: responsibilityScopes, default: null },
  },
  { timestamps: true, collection: "crm_activities" }
);

const noteSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "CrmCustomer", required: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true },
    body: { type: String, required: true, trim: true },
    authorUserId: { type: Types.ObjectId, ref: "User", required: true },
    notificationScope: { type: String, enum: responsibilityScopes, default: null },
  },
  { timestamps: true, collection: "crm_notes" }
);

const issueSchema = new Schema(
  {
    customerId: { type: Types.ObjectId, ref: "CrmCustomer", required: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    category: { type: String, default: "", trim: true },
    severity: { type: String, enum: issueSeverities, default: "LAV" },
    status: { type: String, enum: issueStatuses, default: "APEN" },
    dueDate: { type: Date, default: null },
    ownerUserId: { type: Types.ObjectId, ref: "User", default: null },
    notificationScope: { type: String, enum: responsibilityScopes, default: "ADMIN" },
  },
  { timestamps: true, collection: "crm_issues" }
);

export type CustomerDocument = InferSchemaType<typeof customerSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type ContactDocument = InferSchemaType<typeof contactSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type ActivityDocument = InferSchemaType<typeof activitySchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type NoteDocument = InferSchemaType<typeof noteSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export type IssueDocument = InferSchemaType<typeof issueSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

export const CustomerModel = mongoose.models.CrmCustomer || mongoose.model("CrmCustomer", customerSchema);
export const ContactModel = mongoose.models.CrmContact || mongoose.model("CrmContact", contactSchema);
export const ActivityModel = mongoose.models.CrmActivity || mongoose.model("CrmActivity", activitySchema);
export const NoteModel = mongoose.models.CrmNote || mongoose.model("CrmNote", noteSchema);
export const IssueModel = mongoose.models.CrmIssue || mongoose.model("CrmIssue", issueSchema);
