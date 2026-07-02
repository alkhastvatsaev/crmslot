import type * as admin from "firebase-admin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import {
  channelAllowed,
  normalizeNotificationPreferences,
} from "@/features/notifications/notificationPreferences";
import {
  BM_BACKOFFICE_REQUEST_PARAM,
  NEW_CLIENT_REQUEST_PUSH_TYPE,
} from "@/features/notifications/notificationConstants";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import { logger } from "@/core/logger";

async function staffPushEnabled(db: admin.firestore.Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  const prefs = normalizeNotificationPreferences(snap.data()?.notificationPreferences);
  return channelAllowed(prefs, "push");
}

/** Push FCM — nouvelle demande client (tout le staff actif sauf l'expéditeur). */
export async function notifyStaffNewClientRequestAdmin(params: {
  db: admin.firestore.Firestore;
  auth: typeof admin.auth;
  companyId: string;
  senderUid: string;
  interventionId: string;
  title?: string | null;
  address?: string | null;
  clientLabel?: string | null;
}): Promise<{ notified: number }> {
  const companyId = params.companyId.trim();
  const senderUid = params.senderUid.trim();
  const interventionId = params.interventionId.trim();
  if (!companyId || !interventionId) return { notified: 0 };

  const staff = await listCompanyStaff(params.db, params.auth, companyId);
  const recipients = staff.filter((m) => m.active && m.uid.trim() !== senderUid);

  if (recipients.length === 0) {
    logger.warn("[notifyStaffNewClientRequestAdmin] aucun destinataire staff actif", {
      companyId,
    });
    return { notified: 0 };
  }

  const titleLabel = params.title?.trim() || "Nouvelle demande";
  const title = params.clientLabel?.trim()
    ? `Nouvelle demande — ${params.clientLabel.trim()}`
    : `Nouvelle demande — ${titleLabel}`;
  const body =
    params.address?.trim().slice(0, 180) ||
    titleLabel.slice(0, 180) ||
    "Un client a envoyé une nouvelle demande d'intervention.";

  let notified = 0;
  for (const member of recipients) {
    const uid = member.uid.trim();
    if (!uid) continue;
    try {
      const pushOk = await staffPushEnabled(params.db, uid);
      if (!pushOk) continue;
      const report = await sendNativePushToUser({
        uid,
        title,
        body,
        audiences: ["backoffice", "technician"],
        data: {
          type: NEW_CLIENT_REQUEST_PUSH_TYPE,
          audience: "staff",
          companyId,
          interventionId,
          [BM_BACKOFFICE_REQUEST_PARAM]: interventionId,
        },
      });
      if (report.sent > 0) notified += 1;
    } catch (err) {
      logger.warn("[notifyStaffNewClientRequestAdmin] push failed", {
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { notified };
}
