import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { isFirebaseAdminReady, getAdminDb } from "@/core/config/firebase-admin";
import { logger } from "@/core/logger";

export type SendNativePushParams = {
  uid: string;
  title: string;
  body: string;
  /** Données passées dans le payload — disponibles dans le handler de clic Capacitor. */
  data?: Record<string, string>;
};

export type SendNativePushResult = {
  sent: number;
  failed: number;
  removedStale: number;
};

/**
 * Lit `users/{uid}/fcm_tokens/*` et envoie un push FCM à chaque token actif.
 * Supprime les tokens marqués invalides par FCM (`messaging/registration-token-not-registered`).
 */
export async function sendNativePushToUser(
  params: SendNativePushParams
): Promise<SendNativePushResult> {
  const report: SendNativePushResult = { sent: 0, failed: 0, removedStale: 0 };

  if (!isFirebaseAdminReady()) {
    logger.warn("[sendNativePushToUser] Firebase Admin non initialisé");
    return report;
  }

  const db = getAdminDb();
  const tokensSnap = await db.collection("users").doc(params.uid).collection("fcm_tokens").get();
  if (tokensSnap.empty) return report;

  const messaging = admin.messaging();

  for (const docSnap of tokensSnap.docs) {
    const data = docSnap.data();
    const token = String(data?.token ?? "");
    if (!token) continue;

    try {
      await messaging.send({
        token,
        notification: { title: params.title, body: params.body },
        data: params.data,
        android: {
          priority: "high",
          notification: { channelId: "default", sound: "default" },
        },
        apns: { payload: { aps: { sound: "default" } } },
      });
      report.sent += 1;
    } catch (err) {
      const code = (err as { code?: string } | null)?.code ?? "";
      const isStale =
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token";

      if (isStale) {
        await docSnap.ref.delete().catch(() => {});
        report.removedStale += 1;
      } else {
        report.failed += 1;
        logger.warn("[sendNativePushToUser] FCM send failed", {
          uid: params.uid,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return report;
}
