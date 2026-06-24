import type * as admin from "firebase-admin";

/** Synchronise `bmTenants` / `bmActive` depuis `users/{uid}/company_memberships`. */
export async function syncTenantClaims(
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
  const preferred = preferredActiveCompanyId.trim();
  const fallbackActive = tenants.some((t) => t.startsWith(`${preferred}:`))
    ? preferred
    : (snap.docs[0]?.id ?? preferred);

  await auth().setCustomUserClaims(uid, {
    bmTenants: tenants,
    bmActive: fallbackActive || null,
  });
}
