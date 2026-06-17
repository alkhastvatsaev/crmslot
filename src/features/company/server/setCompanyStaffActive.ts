import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type SetCompanyStaffActiveResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Active ou désactive un membre (technicien + membership). */
export async function setCompanyStaffActive(
  db: admin.firestore.Firestore,
  companyId: string,
  targetUid: string,
  active: boolean
): Promise<SetCompanyStaffActiveResult> {
  const membershipRef = db.doc(`users/${targetUid}/company_memberships/${companyId}`);
  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) {
    return { ok: false, status: 404, error: "Membre introuvable pour cette société." };
  }

  await membershipRef.set({ active, updatedAt: FieldValue.serverTimestamp() }, { merge: true });

  const techRef = db.collection("technicians").doc(targetUid);
  const techSnap = await techRef.get();
  if (techSnap.exists) {
    await techRef.set(
      {
        active,
        companyId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  return { ok: true };
}
