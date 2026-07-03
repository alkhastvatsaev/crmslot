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
  companyId: string,
  assignableStaff?: CompanyStaffMember[]
): Promise<void> {
  const staff = assignableStaff ?? (await listCompanyStaff(db, auth, companyId));
  const assignable = staff.filter(isAssignableStaffMember);
  if (assignable.length === 0) return;

  const existingSnaps = await Promise.all(
    assignable.map((member) => db.collection("technicians").doc(member.uid).get())
  );
  const existingByUid = new Map(existingSnaps.map((snap) => [snap.id, snap]));

  await Promise.all(
    assignable.map(async (member) => {
      const existing = existingByUid.get(member.uid);
      const existingData = existing?.data() ?? {};
      const isActiveProfile =
        existing?.exists === true &&
        existingData.active !== false &&
        (existingData.companyId ?? "").trim() === companyId.trim();

      if (!existing?.exists) {
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
        return;
      }

      const needsAuthUidBackfill = isActiveProfile && !String(existingData.authUid ?? "").trim();

      if (needsAuthUidBackfill) {
        await db.collection("technicians").doc(member.uid).set(
          {
            authUid: member.uid,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      if (!isActiveProfile) {
        await db.collection("technicians").doc(member.uid).set(
          {
            active: true,
            companyId,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    })
  );
}

/** Liste les techniciens assignables pour une société (staff actif + profil terrain). */
export async function listAssignableTechnicians(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<Technician[]> {
  const staff = await listCompanyStaff(db, auth, companyId);
  const assignable = staff.filter(isAssignableStaffMember);
  await ensureAssignableTechnicianProfiles(db, auth, companyId, assignable);

  const assignableUids = new Set(assignable.map((member) => member.uid));

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
