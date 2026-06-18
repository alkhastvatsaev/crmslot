import type * as admin from "firebase-admin";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";

type Gate = { allowed: true } | { allowed: false; status: number; error: string };

/** Même périmètre que `canAccessIvanaPortalChatCompany` (règles Firestore). */
export async function assertClientMayAccessIvanaPortalChat(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string
): Promise<Gate> {
  const trimmedUid = uid.trim();
  const trimmedCompany = companyId.trim();
  if (!trimmedUid || !trimmedCompany) {
    return { allowed: false, status: 400, error: "Paramètres invalides." };
  }

  const membershipSnap = await db
    .doc(`users/${trimmedUid}/company_memberships/${trimmedCompany}`)
    .get();
  if (membershipSnap.exists && membershipSnap.data()?.active !== false) {
    return { allowed: true };
  }

  const portalSnap = await db.collection(CLIENT_PORTAL_PROFILE_COLLECTION).doc(trimmedUid).get();
  const portalCompany =
    typeof portalSnap.data()?.companyId === "string" ? portalSnap.data()!.companyId.trim() : "";
  if (portalSnap.exists && portalCompany === trimmedCompany) {
    return { allowed: true };
  }

  return { allowed: false, status: 403, error: "Accès chat portail refusé." };
}
