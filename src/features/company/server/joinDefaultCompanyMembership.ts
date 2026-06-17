import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { readDefaultStaffCompanyIdFromEnv } from "@/features/company/server/readDefaultStaffCompanyId";

export type JoinDefaultCompanyResult =
  | { ok: true; companyId: string; alreadyMember: boolean }
  | { ok: false; status: number; error: string };

async function syncTenantClaims(
  auth: typeof admin.auth,
  db: admin.firestore.Firestore,
  uid: string,
  preferredActiveCompanyId: string
): Promise<void> {
  const snap = await db.collection(`users/${uid}/company_memberships`).get();
  const tenants = snap.docs.map((d) => {
    const role = (d.data().role as string) === "admin" ? "admin" : "collaborateur";
    return `${d.id}:${role}`;
  });
  const fallbackActive = tenants.some((t) => t.startsWith(`${preferredActiveCompanyId}:`))
    ? preferredActiveCompanyId
    : (snap.docs[0]?.id ?? preferredActiveCompanyId);

  await auth().setCustomUserClaims(uid, {
    bmTenants: tenants,
    bmActive: fallbackActive || null,
  });
}

/** Attache un compte staff à la société unique configurée (Admin SDK). */
export async function joinDefaultCompanyMembership(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  uid: string
): Promise<JoinDefaultCompanyResult> {
  const companyId = readDefaultStaffCompanyIdFromEnv();
  if (!companyId) {
    return {
      ok: false,
      status: 503,
      error: "Société par défaut non configurée (NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID).",
    };
  }

  const companySnap = await db.collection("companies").doc(companyId).get();
  if (!companySnap.exists) {
    return { ok: false, status: 404, error: "Société introuvable." };
  }

  const companyName =
    typeof companySnap.data()?.name === "string" ? (companySnap.data()?.name as string) : "Société";

  const membershipRef = db.doc(`users/${uid}/company_memberships/${companyId}`);
  const existing = await membershipRef.get();
  if (!existing.exists) {
    await membershipRef.set({
      role: "collaborateur",
      joinedAt: FieldValue.serverTimestamp(),
      companyName,
    });
  }

  await syncTenantClaims(auth, db, uid, companyId);

  return { ok: true, companyId, alreadyMember: existing.exists };
}
