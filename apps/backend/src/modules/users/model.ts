import mongoose, { Schema, Types, type InferSchemaType } from "mongoose";
import { roles } from "../auth/types";

const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: roles, required: true, default: "employee" },
    jobTitle: { type: String, trim: true, default: "" },
    departmentId: { type: Types.ObjectId, ref: "Department", default: null, index: true },
    companyId: { type: Types.ObjectId, ref: "Company", required: true, index: true },
    reportsToUserId: { type: Types.ObjectId, ref: "User", default: null, index: true },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

userSchema.index({ companyId: 1, email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
