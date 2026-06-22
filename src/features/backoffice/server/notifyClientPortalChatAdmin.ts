import type * as admin from "firebase-admin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import {
  channelAllowed,
  normalizeNotificationPreferences,
} from "@/features/notifications/notificationPreferences";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";
import { IVANA_PORTAL_CHAT_COLLECTION } from "@/features/backoffice/ivanaChatFirestore";
import { logger } from "@/core/logger";

async function clientPushEnabled(db: admin.firestore.Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection(CLIENT_PORTAL_PROFILE_COLLECTION).doc(uid).get();
  const prefs = normalizeNotificationPreferences(snap.data()?.notificationPreferences);
  return channelAllowed(prefs, "push");
}

async function listCompanyPortalClientUids(
  db: admin.firestore.Firestore,
  companyId: string
): Promise<string[]> {
  const snap = await db
    .collection(CLIENT_PORTAL_PROFILE_COLLECTION)
    .where("companyId", "==", companyId)
    .get();
  return snap.docs.map((d) => d.id.trim()).filter((u) => Boolean(u));
}

async function resolveClientChatRecipientUids(
  db: admin.firestore.Firestore,
  companyId: string,
  senderUid: string,
  interventionId?: string | null
): Promise<string[]> {
  const ivId = interventionId?.trim();
  if (ivId) {
    const ivSnap = await db.collection("interventions").doc(ivId).get();
    const creator =
      typeof ivSnap.data()?.createdByUid === "string" ? ivSnap.data()!.createdByUid.trim() : "";
    if (creator && creator !== senderUid) {
      return [creator];
    }

    const threadSnap = await db
      .collection(IVANA_PORTAL_CHAT_COLLECTION)
      .where("interventionId", "==", ivId)
      .where("role", "==", "client")
      .limit(25)
      .get();
    const fromThread = new Set<string>();
    for (const doc of threadSnap.docs) {
      const uid = typeof doc.data().senderUid === "string" ? doc.data().senderUid.trim() : "";
      if (uid && uid !== senderUid) fromThread.add(uid);
    }
    if (fromThread.size > 0) return [...fromThread];
  }

  return (await listCompanyPortalClientUids(db, companyId)).filter((uid) => uid !== senderUid);
}

export async function notifyClientPortalChatAdmin(params: {
  db: admin.firestore.Firestore;
  companyId: string;
  senderUid: string;
  preview: string;
  interventionId?: string | null;
  staffLabel?: string | null;
}): Promise<{ notified: number }> {
  const companyId = params.companyId.trim();
  const senderUid = params.senderUid.trim();
  if (!companyId || !senderUid) return { notified: 0 };

  const recipientUids = await resolveClientChatRecipientUids(
    params.db,
    companyId,
    senderUid,
    params.interventionId
  );

  const title = params.staffLabel?.trim()
    ? `Message — ${params.staffLabel.trim()}`
    : "Nouveau message du dispatcher";
  const body =
    params.preview.trim().slice(0, 180) || "Un nouveau message vous attend sur le portail.";

  let notified = 0;
  for (const uid of recipientUids) {
    try {
      const pushOk = await clientPushEnabled(params.db, uid);
      if (!pushOk) continue;
      const report = await sendNativePushToUser({
        uid,
        title,
        body,
        data: {
          type: "portal_chat",
          audience: "client",
          companyId,
          ...(params.interventionId?.trim()
            ? { interventionId: params.interventionId.trim() }
            : {}),
        },
      });
      if (report.sent > 0) notified += 1;
    } catch (err) {
      logger.warn("[notifyClientPortalChatAdmin] push failed", {
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { notified };
}
