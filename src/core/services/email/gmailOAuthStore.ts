import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";

const GMAIL_OAUTH_DOC = "platform_config/gmail";

export type StoredGmailOAuth = {
  refreshToken: string;
  email: string;
  updatedAt: string;
};

export async function getStoredGmailOAuth(): Promise<StoredGmailOAuth | null> {
  if (!admin.apps.length) return null;
  const snap = await admin.firestore().doc(GMAIL_OAUTH_DOC).get();
  if (!snap.exists) return null;
  const data = snap.data();
  const refreshToken = String(data?.refreshToken ?? "").trim();
  const email = String(data?.email ?? "").trim();
  if (!refreshToken || !email) return null;
  return {
    refreshToken,
    email,
    updatedAt: String(data?.updatedAt ?? ""),
  };
}

export async function saveStoredGmailOAuth(input: {
  refreshToken: string;
  email: string;
}): Promise<void> {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin indisponible — impossible d’enregistrer Gmail.");
  }
  await admin.firestore().doc(GMAIL_OAUTH_DOC).set(
    {
      refreshToken: input.refreshToken.trim(),
      email: input.email.trim(),
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

export async function clearStoredGmailOAuth(): Promise<void> {
  if (!admin.apps.length) return;
  await admin.firestore().doc(GMAIL_OAUTH_DOC).delete();
}
