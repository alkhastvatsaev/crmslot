import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Technician } from "@/features/technicians";
import { stripLegacyDemoTechnicians } from "@/core/config/legacyDemoTechnicians";
import { listCompanyStaff } from "@/features/company/server/listCompanyStaff";
import { provisionTechnicianStaffRecord } from "@/features/company/server/provisionTechnicianStaff";
import { resolveCompanyStaffKind } from "@/features/teamHub/resolveCompanyStaffKind";
import type { CompanyStaffMember } from "@/features/teamHub/types";

function isAssignableStaffMember(member: CompanyStaffMember): boolean {
  if (!member.active) return false;
  const kind = resolveCompanyStaffKind(member);
  return kind === "technician" || kind === "dirigeant";
}

/** Crée ou réactive les profils terrain manquants (dirigeants + techniciens actifs). */
export async function ensureAssignableTechnicianProfiles(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<void> {
  const staff = await listCompanyStaff(db, auth, companyId);
  const assignable = staff.filter(isAssignableStaffMember);

  await Promise.all(
    assignable.map(async (member) => {
      await provisionTechnicianStaffRecord(
        db,
        {
          uid: member.uid,
          companyId,
          profile: {
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
          },
        },
        { auth }
      );
      await db.collection("technicians").doc(member.uid).set(
        {
          active: true,
          companyId,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    })
  );
}

/** Liste les techniciens assignables pour une société (staff actif + profil terrain). */
export async function listAssignableTechnicians(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<Technician[]> {
  await ensureAssignableTechnicianProfiles(db, auth, companyId);

  const staff = await listCompanyStaff(db, auth, companyId);
  const assignableUids = new Set(staff.filter(isAssignableStaffMember).map((member) => member.uid));

  const snap = await db.collection("technicians").where("companyId", "==", companyId).get();
  return stripLegacyDemoTechnicians(
    snap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Technician, "id">) }))
      .filter((technician) => {
        const uid = (technician.authUid ?? technician.id).trim();
        if (!assignableUids.has(uid)) return false;
        if (technician.active === false) return false;
        return true;
      })
  );
}
