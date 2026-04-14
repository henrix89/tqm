import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";

const companySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    collection: "companies",
  }
);

export type CompanyDocument = InferSchemaType<typeof companySchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const CompanyModel = mongoose.models.Company || mongoose.model("Company", companySchema);
