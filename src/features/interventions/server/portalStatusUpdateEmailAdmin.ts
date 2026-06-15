import type * as admin from "firebase-admin";
import { isGmailConfigured } from "@/core/services/email/sendInterventionEmail";
import { notifyClient } from "@/core/services/email/clientNotifications/notifyClient";
import { buildClientStatusEmail } from "@/core/services/email/clientNotifications/clientStatusTemplates";
import type { Intervention } from "@/features/interventions/types";

export async function sendPortalStatusUpdateEmailAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  iv?: Partial<
    Pick<
      Intervention,
      | "status"
      | "companyId"
      | "clientId"
      | "clientEmail"
      | "clientFirstName"
      | "portalAccessToken"
      | "title"
      | "problem"
      | "createdByUid"
    >
  >;
  fromStatus: Intervention["status"];
  toStatus: Intervention["status"];
}): Promise<boolean> {
  if (params.fromStatus === params.toStatus) return false;
  if (!isGmailConfigured()) return false;

  const snap = await params.db.collection("interventions").doc(params.interventionId).get();
  if (!snap.exists) return false;

  const iv = { id: snap.id, ...snap.data(), ...params.iv } as Intervention;

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) return false;

  const payload = buildClientStatusEmail({
    interventionId: params.interventionId,
    iv,
    fromStatus: params.fromStatus,
    toStatus: params.toStatus,
  });
  if (!payload) return false;

  const result = await notifyClient({
    interventionId: params.interventionId,
    companyId,
    clientId: iv.clientId ?? null,
    fallbackEmail: iv.clientEmail ?? null,
    sentByUid: iv.createdByUid ?? "portal",
    ...payload,
  });

  return result.ok && !("skipped" in result && result.skipped);
}
