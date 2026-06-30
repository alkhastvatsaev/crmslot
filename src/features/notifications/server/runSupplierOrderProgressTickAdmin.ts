import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import "@/core/config/firebase-admin";
import { logger } from "@/core/logger";
import { notifyMaterialOrderStatusAdmin } from "@/features/notifications/server/notifyMaterialOrderStatusAdmin";
import {
  buildSupplierOrderProgressCandidate,
  type SupplierOrderProgressCandidate,
} from "@/features/notifications/supplierOrderProgressTick";

export type SupplierOrderProgressTickReport = {
  scanned: number;
  advanced: number;
  notified: number;
};

async function applySupplierOrderAdvance(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  candidate: SupplierOrderProgressCandidate
): Promise<boolean> {
  const ref = db
    .collection("companies")
    .doc(candidate.companyId)
    .collection("supplierOrders")
    .doc(candidate.orderId);

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: candidate.toStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (candidate.toStatus === "sent") patch.sentAt = now;
  if (candidate.toStatus === "delivered") patch.deliveredAt = now;

  await ref.update(patch);

  const actorUid = candidate.createdByUid?.trim() || "system";
  const result = await notifyMaterialOrderStatusAdmin({
    db,
    auth,
    companyId: candidate.companyId,
    actorUid,
    kind: "supplier",
    fromStatus: candidate.fromStatus,
    toStatus: candidate.toStatus,
    supplierOrderId: candidate.orderId,
    interventionId: candidate.interventionId,
    clientName: candidate.clientName,
  });

  return result.notified > 0;
}

export async function runSupplierOrderProgressTickAdmin(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  now = Date.now()
): Promise<SupplierOrderProgressTickReport> {
  const report: SupplierOrderProgressTickReport = { scanned: 0, advanced: 0, notified: 0 };

  const snap = await db
    .collectionGroup("supplierOrders")
    .where("status", "in", ["draft", "sent", "confirmed"])
    .limit(250)
    .get();

  report.scanned = snap.size;

  for (const docSnap of snap.docs) {
    const companyRef = docSnap.ref.parent.parent;
    const companyId = companyRef?.id?.trim() ?? "";
    if (!companyId) continue;

    const candidate = buildSupplierOrderProgressCandidate(
      companyId,
      docSnap.id,
      docSnap.data() as Record<string, unknown>,
      now
    );
    if (!candidate) continue;

    try {
      await applySupplierOrderAdvance(db, auth, candidate);
      report.advanced += 1;
      report.notified += 1;
    } catch (err) {
      logger.warn("[runSupplierOrderProgressTickAdmin] advance failed", {
        companyId,
        orderId: docSnap.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return report;
}
