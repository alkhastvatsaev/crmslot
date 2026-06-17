import type * as admin from "firebase-admin";
import { FieldPath } from "firebase-admin/firestore";
import type { CompanyStaffMember } from "@/features/teamHub/types";
import { buildTechnicianDisplayName } from "@/features/company/server/provisionTechnicianStaff";

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

/** Liste les membres d'une société (memberships + profil technicien optionnel). */
export async function listCompanyStaff(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<CompanyStaffMember[]> {
  const membershipSnap = await db
    .collectionGroup("company_memberships")
    .where(FieldPath.documentId(), "==", companyId)
    .get();

  const members: CompanyStaffMember[] = [];

  for (const membershipDoc of membershipSnap.docs) {
    const uid = membershipDoc.ref.parent.parent?.id;
    if (!uid) continue;

    const membershipData = membershipDoc.data();
    const role = (membershipData.role as string) === "admin" ? "admin" : "collaborateur";
    const membershipActive = membershipData.active !== false;

    const techSnap = await db.collection("technicians").doc(uid).get();
    const tech = techSnap.exists ? techSnap.data() : null;
    const techCompanyId = typeof tech?.companyId === "string" ? tech.companyId.trim() : "";
    const hasTechnicianProfile = techSnap.exists && (!techCompanyId || techCompanyId === companyId);

    let email = typeof tech?.email === "string" ? tech.email.trim() : "";
    let authDisplayName = "";
    try {
      const userRecord = await auth().getUser(uid);
      email = email || userRecord.email?.trim() || "";
      authDisplayName = userRecord.displayName?.trim() ?? "";
    } catch {
      /* compte Auth supprimé */
    }

    const firstName =
      (typeof tech?.firstName === "string" ? tech.firstName.trim() : "") ||
      splitDisplayName(authDisplayName).firstName;
    const lastName =
      (typeof tech?.lastName === "string" ? tech.lastName.trim() : "") ||
      splitDisplayName(authDisplayName).lastName;

    const displayName =
      (typeof tech?.name === "string" ? tech.name.trim() : "") ||
      buildTechnicianDisplayName({ firstName, lastName, email: email || null }) ||
      email ||
      uid.slice(0, 8);

    const active = hasTechnicianProfile ? tech?.active !== false : membershipActive;

    members.push({
      uid,
      role,
      email: email || null,
      firstName,
      lastName,
      displayName,
      hasTechnicianProfile,
      active,
      authUid:
        typeof tech?.authUid === "string" && tech.authUid.trim()
          ? tech.authUid.trim()
          : hasTechnicianProfile
            ? uid
            : null,
      vehicle: typeof tech?.vehicle === "string" ? tech.vehicle : undefined,
    });
  }

  return members.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
}
