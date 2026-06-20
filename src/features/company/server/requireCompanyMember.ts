import type * as admin from "firebase-admin";

export type CompanyMemberContext = {
  uid: string;
  companyId: string;
  role: "admin" | "collaborateur";
};

export type CompanyMemberGuardFailure = {
  status: number;
  error: string;
};

/** Vérifie que l'utilisateur appartient à la société (admin ou collaborateur). */
export async function requireCompanyMember(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string
): Promise<CompanyMemberContext | CompanyMemberGuardFailure> {
  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) {
    return { status: 400, error: "Identifiant société requis." };
  }

  const snap = await db.doc(`users/${uid}/company_memberships/${trimmedCompanyId}`).get();
  if (!snap.exists) {
    return { status: 403, error: "Accès société refusé." };
  }

  const role = (snap.data()?.role as string) === "admin" ? "admin" : "collaborateur";
  return { uid, companyId: trimmedCompanyId, role };
}
