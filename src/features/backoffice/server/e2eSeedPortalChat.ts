import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { PORTAL_CHAT_COLLECTION } from "@/features/backoffice/portalChatFirestore";
import { PORTAL_CHAT_SENDER_THREAD_PREFIX } from "@/features/backoffice/portalChatInboxLogic";
import { getE2eSeedCompanyId } from "@/features/interventions/server/e2eSeedConfig";

export const E2E_PORTAL_CHAT_SENDER_UID = "e2e-portal-chat-client";
export const E2E_PORTAL_CHAT_MARKER = "E2E portal chat smoke";

export type E2eSeedPortalChatResult = {
  companyId: string;
  senderUid: string;
  chatThreadId: string;
  messageId: string;
  body: string;
  reset: boolean;
};

function resolveE2ePortalChatCompanyId(): string {
  const portalDefault = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID?.trim();
  if (portalDefault) return portalDefault;
  return getE2eSeedCompanyId();
}

/** Seed dev : message client portail pour smoke Playwright inbox admin. */
export async function e2eSeedPortalChatAdmin(
  db: admin.firestore.Firestore,
  opts?: { body?: string; reset?: boolean }
): Promise<E2eSeedPortalChatResult> {
  const companyId = resolveE2ePortalChatCompanyId();
  const senderUid = E2E_PORTAL_CHAT_SENDER_UID;
  const body = opts?.body?.trim() || `${E2E_PORTAL_CHAT_MARKER} ${Date.now()}`;
  const reset = opts?.reset !== false;
  const chatThreadId = `${PORTAL_CHAT_SENDER_THREAD_PREFIX}${senderUid}`;

  if (reset) {
    const existing = await db
      .collection(PORTAL_CHAT_COLLECTION)
      .where("companyId", "==", companyId)
      .where("senderUid", "==", senderUid)
      .limit(50)
      .get();
    if (!existing.empty) {
      const batch = db.batch();
      existing.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
  }

  await db.collection("client_portal_profiles").doc(senderUid).set(
    {
      companyId,
      displayName: "E2E Client Chat",
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const ref = await db.collection(PORTAL_CHAT_COLLECTION).add({
    companyId,
    body,
    role: "client",
    senderUid,
    senderName: "E2E Client Chat",
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    companyId,
    senderUid,
    chatThreadId,
    messageId: ref.id,
    body,
    reset,
  };
}
