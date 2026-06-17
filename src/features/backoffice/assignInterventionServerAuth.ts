import type * as admin from "firebase-admin";

/** Droits dispatch pour assigner une intervention (Admin SDK, hors règles client). */
export async function assertCanAssignInterventionServer(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string,
  decoded: admin.auth.DecodedIdToken
): Promise<boolean> {
  const cid = companyId.trim();
  if (!cid) return false;

  const tenants = decoded.bmTenants;
  if (
    Array.isArray(tenants) &&
    tenants.some((t) => t === `${cid}:admin` || t === `${cid}:collaborateur`)
  ) {
    return true;
  }

  const mem = await db.doc(`users/${uid}/company_memberships/${cid}`).get();
  if (!mem.exists) return false;
  const role = mem.data()?.role;
  return role === "admin" || role === "collaborateur";
}
