import type * as admin from "firebase-admin";
import { logger } from "@/core/logger";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import {
  channelAllowed,
  normalizeNotificationPreferences,
} from "@/features/notifications/notificationPreferences";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import { isMaterialOrderPushRecipient } from "@/features/notifications/server/notifyMaterialOrderPlacedAdmin";

export type NotifyMaterialOrderStaffPushResult = {
  recipients: number;
  notified: number;
  sent: number;
  failed: number;
};

async function staffPushEnabled(db: admin.firestore.Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  const prefs = normalizeNotificationPreferences(snap.data()?.notificationPreferences);
  return channelAllowed(prefs, "push");
}

/** Push FCM — admins actifs + techniciens actifs de la société. */
export async function notifyMaterialOrderStaffPush(params: {
  db: admin.firestore.Firestore;
  auth: typeof admin.auth;
  companyId: string;
  actorUid: string;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<NotifyMaterialOrderStaffPushResult> {
  const result: NotifyMaterialOrderStaffPushResult = {
    recipients: 0,
    notified: 0,
    sent: 0,
    failed: 0,
  };

  const companyId = params.companyId.trim();
  if (!companyId) return result;

  const staff = await listCompanyStaff(params.db, params.auth, companyId);
  const recipients = staff.filter(isMaterialOrderPushRecipient);
  result.recipients = recipients.length;
  if (recipients.length === 0) return result;

  const title = params.title.trim();
  const body = params.body.trim().slice(0, 180);

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
        data: params.data,
      });
      result.sent += report.sent;
      result.failed += report.failed;
      if (report.sent > 0) result.notified += 1;
    } catch (err) {
      result.failed += 1;
      logger.warn("[notifyMaterialOrderStaffPush] push failed", {
        uid,
        companyId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}
