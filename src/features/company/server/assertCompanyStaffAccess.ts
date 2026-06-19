import type * as admin from "firebase-admin";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";

export type CompanyStaffAccessResult = { ok: true } | { ok: false; status: number; error: string };

/** Vérifie que l'utilisateur est staff (admin/collaborateur) de la société demandée. */
export async function assertCompanyStaffAccess(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string,
  decoded: admin.auth.DecodedIdToken
): Promise<CompanyStaffAccessResult> {
  const cid = companyId.trim();
  if (!cid) {
    return { ok: false, status: 400, error: "companyId requis." };
  }

  const allowed = await assertCanAssignInterventionServer(db, uid, cid, decoded);
  if (!allowed) {
    return { ok: false, status: 403, error: "Accès société refusé." };
  }

  return { ok: true };
}
