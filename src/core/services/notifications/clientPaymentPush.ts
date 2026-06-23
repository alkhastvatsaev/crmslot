import * as admin from "firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { clientNotificationCaseUrl } from "@/features/notifications";

async function listFcmTokens(uid: string): Promise<string[]> {
  const snap = await getAdminDb().collection("users").doc(uid).collection("fcm_tokens").get();
  return snap.docs
    .map((d) => (typeof d.data().token === "string" ? d.data().token : ""))
    .filter((t) => t.length > 0);
}

/** Notifie le demandeur portail client après paiement Stripe (best-effort). */
export async function notifyClientPaymentReceived(
  interventionId: string,
  createdByUid: string | null | undefined
): Promise<void> {
  const uid = typeof createdByUid === "string" ? createdByUid.trim() : "";
  if (!uid || !admin.apps.length) return;

  const profile = await getAdminDb().collection("client_portal_profiles").doc(uid).get();
  if (!profile.exists) return;

  const tokens = await listFcmTokens(uid);
  if (!tokens.length) return;

  const origin =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: "Paiement enregistré",
      body: "Merci — votre paiement a bien été reçu.",
    },
    data: {
      type: "payment_received",
      interventionId,
    },
    webpush: {
      fcmOptions: {
        link: `${clientNotificationCaseUrl(origin, interventionId)}&payment=success`,
      },
    },
  });
}
