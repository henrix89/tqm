import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth, requirePasswordChangeCompleted } from "../auth/middleware";
import { CustomerModel } from "../crm/models";
import { canReadCustomer } from "../crm/access";
import type { AuthenticatedRequest } from "../auth/types";
import { getFileAssetById, readFileAssetContent } from "./service";

export const router = Router();

router.use(requireAuth, requirePasswordChangeCompleted);

router.get(
  "/:id/content",
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const asset = await getFileAssetById(req.params.id);
    if (!asset) return res.status(404).json({ error: "File not found" });

    const actor = req.auth!;

    if (asset.kind === "crm_customer") {
      const customer = await CustomerModel.findById(asset.entityId);
      if (!customer) return res.status(404).json({ error: "Customer not found" });

      const allowed = canReadCustomer(actor, {
        companyId: String(customer.companyId),
        departmentId: customer.departmentId ? String(customer.departmentId) : null,
        ownerUserId: String(customer.ownerUserId),
        sharedWithUserIds: customer.sharedWithUserIds.map((item) => String(item)),
      });

      if (!allowed) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (actor.role !== "superadmin" && actor.companyId !== asset.companyId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const buffer = await readFileAssetContent(asset.storagePath);
    res.setHeader("Content-Type", asset.contentType);
    res.setHeader("Content-Length", String(asset.sizeBytes));
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(asset.fileName)}"`);
    res.send(buffer);
  })
);
