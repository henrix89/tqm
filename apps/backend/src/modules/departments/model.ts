import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

const departmentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    managerUserId: { type: Types.ObjectId, ref: "User", default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "departments",
  }
);

departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });

export type DepartmentDocument = InferSchemaType<typeof departmentSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const DepartmentModel = mongoose.models.Department || mongoose.model("Department", departmentSchema);
