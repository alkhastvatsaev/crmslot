import type * as admin from "firebase-admin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import {
  channelAllowed,
  normalizeNotificationPreferences,
} from "@/features/notifications/notificationPreferences";
import { BM_BACKOFFICE_CHAT_PARAM } from "@/features/notifications/notificationConstants";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import { logger } from "@/core/logger";

async function staffPushEnabled(db: admin.firestore.Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  const prefs = normalizeNotificationPreferences(snap.data()?.notificationPreferences);
  return channelAllowed(prefs, "push");
}

export async function notifyStaffPortalChatAdmin(params: {
  db: admin.firestore.Firestore;
  auth: typeof admin.auth;
  companyId: string;
  senderUid: string;
  preview: string;
  interventionId?: string | null;
  clientLabel?: string | null;
}): Promise<{ notified: number }> {
  const companyId = params.companyId.trim();
  const senderUid = params.senderUid.trim();
  if (!companyId || !senderUid) return { notified: 0 };

  const staff = await listCompanyStaff(params.db, params.auth, companyId);
  const recipients = staff.filter((m) => m.active && m.uid.trim() !== senderUid);

  if (recipients.length === 0) {
    logger.warn("[notifyStaffPortalChatAdmin] aucun destinataire staff actif", { companyId });
    return { notified: 0 };
  }

  const title = params.clientLabel?.trim()
    ? `Message client — ${params.clientLabel.trim()}`
    : "Nouveau message client";
  const body =
    params.preview.trim().slice(0, 180) || "Un client a envoyé un message sur le portail.";

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
          type: "portal_chat",
          audience: "staff",
          companyId,
          [BM_BACKOFFICE_CHAT_PARAM]: params.interventionId?.trim() || "global",
          ...(params.interventionId?.trim()
            ? { interventionId: params.interventionId.trim() }
            : {}),
        },
      });
      if (report.sent > 0) notified += 1;
    } catch (err) {
      logger.warn("[notifyStaffPortalChatAdmin] push failed", {
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { notified };
}
