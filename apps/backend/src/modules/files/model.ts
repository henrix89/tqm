import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const fileAssetKinds = ["crm_customer", "incident"] as const;

const fileAssetSchema = new Schema(
  {
    kind: { type: String, enum: fileAssetKinds, required: true },
    entityId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    fileName: { type: String, required: true, trim: true },
    contentType: { type: String, required: true, trim: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true, trim: true },
    uploadedBy: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: false }, collection: "file_assets" }
);

export type FileAssetDocument = InferSchemaType<typeof fileAssetSchema> & {
  _id: mongoose.Types.ObjectId;
  uploadedAt: Date;
};

export const FileAssetModel =
  mongoose.models.FileAsset || mongoose.model("FileAsset", fileAssetSchema);
