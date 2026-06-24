import * as admin from "firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { clientNotificationCaseUrl } from "@/features/notifications/clientNotificationUrls";
import {
  buildFcmPayloadForPlatform,
  normalizeFcmTokenPlatform,
} from "@/features/notifications/buildFcmSendPayload";

async function listFcmTokenDocs(
  uid: string
): Promise<Array<{ token: string; platform: ReturnType<typeof normalizeFcmTokenPlatform> }>> {
  const snap = await getAdminDb().collection("users").doc(uid).collection("fcm_tokens").get();
  return snap.docs
    .map((d) => {
      const token = typeof d.data().token === "string" ? d.data().token.trim() : "";
      if (!token) return null;
      return { token, platform: normalizeFcmTokenPlatform(d.data().platform) };
    })
    .filter(
      (row): row is { token: string; platform: ReturnType<typeof normalizeFcmTokenPlatform> } =>
        Boolean(row)
    );
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

  const tokenDocs = await listFcmTokenDocs(uid);
  if (!tokenDocs.length) return;

  const origin =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  const paymentLink = `${clientNotificationCaseUrl(origin, interventionId)}&payment=success`;
  const baseParams = {
    title: "Paiement enregistré",
    body: "Merci — votre paiement a bien été reçu.",
    data: {
      type: "payment_received",
      interventionId,
    },
    origin,
  };

  await Promise.all(
    tokenDocs.map(async ({ token, platform }) => {
      const payload = buildFcmPayloadForPlatform(platform, baseParams);
      const webpush =
        platform === "web"
          ? { ...payload.webpush, fcmOptions: { link: paymentLink } }
          : payload.webpush;
      await admin.messaging().send({ token, ...payload, webpush });
    })
  );
}
