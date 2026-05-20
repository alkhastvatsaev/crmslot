import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import {
  isLocalDevelopmentRuntime,
  LOCAL_DEV_GMAIL_UID,
} from "@/core/api/routeAuth";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";

/** Vérifie que l'utilisateur peut agir pour cette société (Gmail hub + lien dossier). */
export async function verifyGmailRouteCompanyAccess(
  uid: string,
  companyId: string,
): Promise<boolean> {
  const id = companyId.trim();
  if (!id) return false;
  if (
    isLocalDevelopmentRuntime() &&
    uid === LOCAL_DEV_GMAIL_UID &&
    id === DEMO_COMPANY_ID
  ) {
    return true;
  }
  if (!admin.apps.length) return false;
  const snap = await admin.firestore().doc(`users/${uid}/company_memberships/${id}`).get();
  return snap.exists;
}
