import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { COMPANY_STAFF_DIRECTORY_COLLECTION } from "@/features/company/server/companyStaffDirectory";

export type RemoveCompanyStaffMemberResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Retire un employé de la société (membership + annuaire ; désactive le profil terrain). */
export async function removeCompanyStaffMember(
  db: admin.firestore.Firestore,
  companyId: string,
  targetUid: string,
  actorUid: string
): Promise<RemoveCompanyStaffMemberResult> {
  const trimmedCompanyId = companyId.trim();
  const trimmedTargetUid = targetUid.trim();
  const trimmedActorUid = actorUid.trim();

  if (!trimmedCompanyId || !trimmedTargetUid) {
    return { ok: false, status: 400, error: "Paramètres invalides." };
  }

  if (trimmedTargetUid === trimmedActorUid) {
    return {
      ok: false,
      status: 400,
      error: "Utilisez votre profil pour supprimer votre propre compte.",
    };
  }

  const membershipRef = db.doc(`users/${trimmedTargetUid}/company_memberships/${trimmedCompanyId}`);
  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) {
    return { ok: false, status: 404, error: "Membre introuvable pour cette société." };
  }

  await membershipRef.delete();

  await db
    .doc(`companies/${trimmedCompanyId}/${COMPANY_STAFF_DIRECTORY_COLLECTION}/${trimmedTargetUid}`)
    .delete()
    .catch(() => {});

  const techRef = db.collection("technicians").doc(trimmedTargetUid);
  const techSnap = await techRef.get();
  if (techSnap.exists) {
    const techCompanyId =
      typeof techSnap.data()?.companyId === "string" ? techSnap.data()!.companyId.trim() : "";
    if (!techCompanyId || techCompanyId === trimmedCompanyId) {
      await techRef.set(
        {
          active: false,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  }

  return { ok: true };
}
