import type * as admin from "firebase-admin";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth";

export async function upsertPortalChatProfileAdmin(
  db: admin.firestore.Firestore,
  params: {
    uid: string;
    companyId: string;
    email?: string | null;
    displayName?: string | null;
  }
): Promise<void> {
  const uid = params.uid.trim();
  const companyId = params.companyId.trim();
  if (!uid || !companyId) return;

  const displayName = params.displayName?.trim() || null;

  await db
    .collection(CLIENT_PORTAL_PROFILE_COLLECTION)
    .doc(uid)
    .set(
      {
        uid,
        companyId,
        role: "client",
        email: params.email ?? null,
        displayName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}
