import type * as admin from "firebase-admin";

export type CompanyAdminContext = {
  uid: string;
  companyId: string;
};

export type CompanyAdminGuardFailure = {
  status: number;
  error: string;
};

/** Vérifie que l'utilisateur est admin de la société demandée. */
export async function requireCompanyAdmin(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string
): Promise<CompanyAdminContext | CompanyAdminGuardFailure> {
  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) {
    return { status: 400, error: "Identifiant société requis." };
  }

  const snap = await db.doc(`users/${uid}/company_memberships/${trimmedCompanyId}`).get();
  if (!snap.exists) {
    return { status: 403, error: "Accès société refusé." };
  }

  if ((snap.data()?.role as string) !== "admin") {
    return { status: 403, error: "Réservé aux administrateurs." };
  }

  return { uid, companyId: trimmedCompanyId };
}
