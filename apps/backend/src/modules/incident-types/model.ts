import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

const incidentTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: "" },
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "incident_types",
  }
);

incidentTypeSchema.index({ companyId: 1, slug: 1 }, { unique: true });

export type IncidentTypeDocument = InferSchemaType<typeof incidentTypeSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const IncidentTypeModel = mongoose.models.IncidentType || mongoose.model("IncidentType", incidentTypeSchema);
