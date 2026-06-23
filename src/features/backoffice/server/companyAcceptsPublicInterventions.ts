import type * as admin from "firebase-admin";

/** Miroir règle Firestore `companyAcceptsPublicInterventions`. */
export async function companyAcceptsPublicInterventions(
  db: admin.firestore.Firestore,
  companyId: string
): Promise<boolean> {
  const trimmed = companyId.trim();
  if (!trimmed) return false;
  const snap = await db.collection("companies").doc(trimmed).get();
  return snap.exists && snap.data()?.acceptsPublicInterventions === true;
}
