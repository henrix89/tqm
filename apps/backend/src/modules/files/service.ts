import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../../core/config";
import { FileAssetModel, fileAssetKinds, type FileAssetDocument } from "./model";

export type FileAssetKind = (typeof fileAssetKinds)[number];

type CreateFileAssetInput = {
  kind: FileAssetKind;
  entityId: string;
  companyId: string;
  fileName: string;
  contentType: string;
  dataBase64: string;
  uploadedBy: string;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || `vedlegg-${Date.now()}.bin`;
}

function normalizeBase64(dataBase64: string) {
  const parts = dataBase64.split(",");
  return (parts.length > 1 ? parts[1] : parts[0]).trim();
}

function mapFileAsset(asset: FileAssetDocument) {
  return {
    id: String(asset._id),
    fileName: asset.fileName,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    storagePath: asset.storagePath,
    uploadedBy: asset.uploadedBy,
    uploadedAt: asset.uploadedAt,
  };
}

export async function createFileAsset(input: CreateFileAssetInput) {
  const base64 = normalizeBase64(input.dataBase64);
  const buffer = Buffer.from(base64, "base64");

  if (!buffer.length) {
    throw new Error("File is empty");
  }

  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large");
  }

  const safeName = sanitizeFileName(input.fileName);
  const extension = path.extname(safeName);
  const storedName = `${Date.now()}-${randomUUID()}${extension}`;
  const relativeDir = input.kind;
  const relativePath = path.join(relativeDir, storedName);
  const absoluteDir = path.join(config.uploadDir, relativeDir);
  const absolutePath = path.join(config.uploadDir, relativePath);

  await fs.mkdir(absoluteDir, { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  const created = await FileAssetModel.create({
    kind: input.kind,
    entityId: input.entityId,
    companyId: input.companyId,
    fileName: safeName,
    contentType: input.contentType || "application/octet-stream",
    sizeBytes: buffer.byteLength,
    storagePath: relativePath,
    uploadedBy: input.uploadedBy,
  });

  return mapFileAsset(created);
}

export async function listAttachmentsForEntity(kind: FileAssetKind, entityId: string) {
  const items = await FileAssetModel.find({ kind, entityId }).sort({ uploadedAt: -1 });
  return items.map(mapFileAsset);
}

export async function listAttachmentCounts(kind: FileAssetKind, entityIds: string[]) {
  if (!entityIds.length) return new Map<string, number>();

  const rows = await FileAssetModel.aggregate<{ _id: string; count: number }>([
    { $match: { kind, entityId: { $in: entityIds } } },
    { $group: { _id: "$entityId", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [row._id, row.count]));
}

export async function getFileAssetById(id: string) {
  const item = await FileAssetModel.findById(id);
  return item ? item : null;
}

export async function readFileAssetContent(storagePath: string) {
  const absolutePath = path.join(config.uploadDir, storagePath);
  return fs.readFile(absolutePath);
}
