import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CompanyStaffKind } from "@/features/teamHub/types";
import {
  companyStaffKindNeedsTechnicianProfile,
  companyStaffKindToMembershipRole,
} from "@/features/teamHub/resolveCompanyStaffKind";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
import { provisionTechnicianStaffRecord } from "@/features/company/server/provisionTechnicianStaff";
import { syncTenantClaims } from "@/features/company/server/syncTenantClaims";
import type { UpdateCompanyStaffResult } from "@/features/company/server/updateCompanyStaffMember";

async function deactivateTechnicianForCompany(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string
): Promise<void> {
  const techRef = db.collection("technicians").doc(uid);
  const techSnap = await techRef.get();
  if (!techSnap.exists) return;

  const techCompanyId =
    typeof techSnap.data()?.companyId === "string" ? techSnap.data()!.companyId.trim() : "";
  if (!techCompanyId || techCompanyId === companyId.trim()) {
    await techRef.set(
      {
        active: false,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/** Applique un changement de rôle métier (dirigeant / dispatcher / technicien). */
export async function changeCompanyStaffKind(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string,
  targetUid: string,
  staffKind: CompanyStaffKind,
  profile: { firstName?: string; lastName?: string; email?: string | null }
): Promise<UpdateCompanyStaffResult> {
  const membershipRef = db.doc(`users/${targetUid}/company_memberships/${companyId}`);
  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) {
    return { ok: false, status: 404, error: "Membre introuvable pour cette société." };
  }

  const membershipRole = companyStaffKindToMembershipRole(staffKind);
  const currentRole =
    (membershipSnap.data()?.role as string) === "admin" ? "admin" : "collaborateur";

  if (currentRole !== membershipRole) {
    await membershipRef.update({
      role: membershipRole,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await upsertCompanyStaffDirectoryEntry(db, companyId, targetUid, membershipRole);
    await syncTenantClaims(auth, db, targetUid, companyId);
  }

  if (companyStaffKindNeedsTechnicianProfile(staffKind)) {
    await provisionTechnicianStaffRecord(db, {
      uid: targetUid,
      companyId,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email ?? null,
      },
    });
    await db.collection("technicians").doc(targetUid).set(
      {
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    await deactivateTechnicianForCompany(db, targetUid, companyId);
  }

  return { ok: true };
}
