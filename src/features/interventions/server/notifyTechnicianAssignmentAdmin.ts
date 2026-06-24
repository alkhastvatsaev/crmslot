import type * as admin from "firebase-admin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import {
  channelAllowed,
  normalizeNotificationPreferences,
} from "@/features/notifications/notificationPreferences";
import { interventionAssignmentPreview } from "@/features/interventions/technicianNewAssignmentAlerts";
import type { Intervention } from "@/features/interventions/types";
import { logger } from "@/core/logger";

async function technicianPushEnabled(db: admin.firestore.Firestore, uid: string): Promise<boolean> {
  const snap = await db.collection("users").doc(uid).get();
  const prefs = normalizeNotificationPreferences(snap.data()?.notificationPreferences);
  return channelAllowed(prefs, "push");
}

/** Push FCM au technicien assigné (complète la Cloud Function si absente). */
export async function notifyTechnicianAssignmentAdmin(params: {
  db: admin.firestore.Firestore;
  technicianUid: string;
  interventionId: string;
  iv: Pick<Intervention, "title" | "problem" | "clientFirstName" | "clientLastName" | "clientName">;
}): Promise<{ sent: number }> {
  const uid = params.technicianUid.trim();
  const interventionId = params.interventionId.trim();
  if (!uid || !interventionId) return { sent: 0 };

  try {
    const pushOk = await technicianPushEnabled(params.db, uid);
    if (!pushOk) return { sent: 0 };

    const body = interventionAssignmentPreview(params.iv as Intervention);
    const report = await sendNativePushToUser({
      uid,
      title: "Nouvelle intervention",
      body,
      audiences: ["technician"],
      data: {
        type: "assignment",
        interventionId,
      },
    });
    return { sent: report.sent };
  } catch (err) {
    logger.warn("[notifyTechnicianAssignmentAdmin] push failed", {
      uid,
      interventionId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { sent: 0 };
  }
}
