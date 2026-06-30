import type * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import {
  buildOrderStatusPushBody,
  buildOrderStatusPushData,
  type OrderStatusPushKind,
} from "@/features/notifications/materialOrderStatusPush";
import { buildMaterialOrderPushTitle } from "@/features/notifications/server/notifyMaterialOrderPlacedAdmin";
import { notifyMaterialOrderStaffPush } from "@/features/notifications/server/notifyMaterialOrderStaffPush";

export type NotifyMaterialOrderStatusParams = {
  db: admin.firestore.Firestore;
  auth: typeof admin.auth;
  companyId: string;
  actorUid: string;
  kind: OrderStatusPushKind;
  fromStatus?: string | null;
  toStatus: string;
  supplierOrderId?: string | null;
  materialOrderId?: string | null;
  interventionId?: string | null;
  clientName?: string | null;
};

export type NotifyMaterialOrderStatusResult = {
  recipients: number;
  notified: number;
  sent: number;
  failed: number;
};

/** Push natif FCM — changement d'étape commande matériel / fournisseur. */
export async function notifyMaterialOrderStatusAdmin(
  params: NotifyMaterialOrderStatusParams
): Promise<NotifyMaterialOrderStatusResult> {
  const companyId = params.companyId.trim();
  const actorUid = params.actorUid.trim();
  const toStatus = params.toStatus.trim();
  const fromStatus = params.fromStatus?.trim() ?? "";

  if (!companyId || !actorUid || !toStatus || (fromStatus && fromStatus === toStatus)) {
    return { recipients: 0, notified: 0, sent: 0, failed: 0 };
  }

  return notifyMaterialOrderStaffPush({
    db: params.db,
    auth: params.auth,
    companyId,
    actorUid,
    title: buildMaterialOrderPushTitle(params.clientName),
    body: buildOrderStatusPushBody(params.kind, toStatus, fromStatus || null),
    data: buildOrderStatusPushData({
      companyId,
      kind: params.kind,
      fromStatus: fromStatus || null,
      toStatus,
      supplierOrderId: params.supplierOrderId,
      materialOrderId: params.materialOrderId,
      interventionId: params.interventionId,
    }),
  });
}
