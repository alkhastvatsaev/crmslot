import type * as admin from "firebase-admin";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import {
  channelAllowed,
  normalizeNotificationPreferences,
} from "@/features/notifications/notificationPreferences";
import type { Intervention } from "@/features/interventions/types";
import { logger } from "@/core/logger";

function unassignmentPreview(
  iv: Pick<Intervention, "title" | "problem" | "clientFirstName" | "clientLastName" | "clientName">
): string {
  const title = (iv.title ?? "").trim() || (iv.problem ?? "").trim();
  if (title) return title.slice(0, 120);
  const client =
    [iv.clientFirstName, iv.clientLastName].filter(Boolean).join(" ").trim() ||
    (iv.clientName ?? "").trim();
  if (client) return client.slice(0, 120);
  return "une intervention";
}

/** Push FCM à l'ancien technicien pour l'informer qu'il a été retiré. */
export async function notifyTechnicianUnassignmentAdmin(params: {
  db: admin.firestore.Firestore;
  technicianUid: string;
  interventionId: string;
  iv: Pick<Intervention, "title" | "problem" | "clientFirstName" | "clientLastName" | "clientName">;
}): Promise<{ sent: number }> {
  const uid = params.technicianUid.trim();
  const interventionId = params.interventionId.trim();
  if (!uid || !interventionId) return { sent: 0 };

  try {
    const snap = await params.db.collection("users").doc(uid).get();
    const prefs = normalizeNotificationPreferences(snap.data()?.notificationPreferences);
    if (!channelAllowed(prefs, "push")) return { sent: 0 };

    const body = `Vous n'êtes plus assigné à ${unassignmentPreview(params.iv)}`;
    const report = await sendNativePushToUser({
      uid,
      title: "Intervention réassignée",
      body,
      audiences: ["backoffice", "technician"],
      data: {
        type: "unassignment",
        audience: "technician",
        interventionId,
      },
    });
    if (report.sent === 0) {
      logger.warn("[notifyTechnicianUnassignmentAdmin] 0 jeton FCM actif", {
        uid,
        interventionId,
      });
    }
    return { sent: report.sent };
  } catch (err) {
    logger.warn("[notifyTechnicianUnassignmentAdmin] push failed", {
      uid,
      interventionId,
      error: err instanceof Error ? err.message : String(err),
    });
    return { sent: 0 };
  }
}
