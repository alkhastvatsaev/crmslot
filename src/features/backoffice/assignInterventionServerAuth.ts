import type * as admin from "firebase-admin";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";

export function isServerDevUiPreview(): boolean {
  return (
    (process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_STAGING_PREVIEW === "true" ||
      process.env.NEXT_PUBLIC_FORCE_DEV_UI_PREVIEW === "true") &&
    process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW !== "true"
  );
}

/** Droits dispatch pour assigner une intervention (Admin SDK, hors règles client). */
export async function assertCanAssignInterventionServer(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string,
  decoded: admin.auth.DecodedIdToken,
): Promise<boolean> {
  const cid = companyId.trim();
  if (!cid) return false;

  if (isServerDevUiPreview() && cid === DEMO_COMPANY_ID) return true;

  const tenants = decoded.bmTenants;
  if (Array.isArray(tenants) && tenants.some((t) => t === `${cid}:admin`)) {
    return true;
  }

  const mem = await db.doc(`users/${uid}/company_memberships/${cid}`).get();
  if (!mem.exists) return false;
  const role = mem.data()?.role;
  return role === "admin";
}
