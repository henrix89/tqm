import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const inspectionStatuses = ["PLANNED", "COMPLETED"] as const;
export const findingSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export const findingStatuses = ["OPEN", "IN_PROGRESS", "DONE"] as const;

const findingSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    severity: { type: String, enum: findingSeverities, default: "LOW" },
    status: { type: String, enum: findingStatuses, default: "OPEN" },
    assigneeUserId: { type: String, default: null },
    dueDate: { type: Date, default: null },
    incidentId: { type: String, default: null },
  },
  { _id: true }
);

const inspectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    location: { type: String, default: "", trim: true },
    departmentId: { type: String, default: null, index: true },
    companyId: { type: String, required: true, index: true },
    plannedFor: { type: Date, required: true },
    status: { type: String, enum: inspectionStatuses, default: "PLANNED" },
    createdBy: { type: String, required: true },
    findings: { type: [findingSchema], default: [] },
  },
  { timestamps: true, collection: "inspections" }
);

export type InspectionDocument = InferSchemaType<typeof inspectionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const InspectionModel =
  mongoose.models.Inspection || mongoose.model("Inspection", inspectionSchema);
