import type * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { buildMaterialOrderPlacedPushData } from "@/features/notifications/materialOrderStatusPush";
import { notifyMaterialOrderStaffPush } from "@/features/notifications/server/notifyMaterialOrderStaffPush";

export type NotifyMaterialOrderPlacedParams = {
  db: admin.firestore.Firestore;
  auth: typeof admin.auth;
  companyId: string;
  actorUid: string;
  body: string;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
  interventionId?: string | null;
  clientName?: string | null;
};

export type NotifyMaterialOrderPlacedResult = {
  recipients: number;
  notified: number;
  sent: number;
  failed: number;
};

export function buildMaterialOrderPushTitle(clientName?: string | null): string {
  const label = clientName?.trim();
  return label ? `Commande matériel — ${label}` : "Commande matériel";
}

export { buildMaterialOrderPlacedPushData as buildMaterialOrderPushData };

export function isMaterialOrderPushRecipient(member: {
  active: boolean;
  role: string;
  hasTechnicianProfile: boolean;
}): boolean {
  if (!member.active) return false;
  return member.role === "admin" || member.hasTechnicianProfile;
}

/** Push natif FCM — nouvelle commande matériel (admins + techniciens actifs). */
export async function notifyMaterialOrderPlacedAdmin(
  params: NotifyMaterialOrderPlacedParams
): Promise<NotifyMaterialOrderPlacedResult> {
  const companyId = params.companyId.trim();
  const actorUid = params.actorUid.trim();
  if (!companyId || !actorUid) {
    return { recipients: 0, notified: 0, sent: 0, failed: 0 };
  }

  return notifyMaterialOrderStaffPush({
    db: params.db,
    auth: params.auth,
    companyId,
    actorUid,
    title: buildMaterialOrderPushTitle(params.clientName),
    body: params.body.trim().slice(0, 180) || "Une nouvelle commande matériel a été passée.",
    data: buildMaterialOrderPlacedPushData({
      companyId,
      supplierOrderId: params.supplierOrderId,
      materialOrderId: params.materialOrderId,
      interventionId: params.interventionId,
    }),
  });
}
