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

function isFirestoreIndexError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /index|FAILED_PRECONDITION/i.test(message);
}

type TechnicianRow = Record<string, unknown> | null;

async function buildStaffMember(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string,
  uid: string,
  membershipData: Record<string, unknown>,
  techData: TechnicianRow
): Promise<CompanyStaffMember> {
  const role = (membershipData.role as string) === "admin" ? "admin" : "collaborateur";
  const membershipActive = membershipData.active !== false;

  const tech = techData;
  const techCompanyId = typeof tech?.companyId === "string" ? tech.companyId.trim() : "";
  const hasTechnicianProfile = Boolean(tech) && (!techCompanyId || techCompanyId === companyId);

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

  return {
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
  };
}

async function loadMemberByUid(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string,
  uid: string
): Promise<CompanyStaffMember | null> {
  const membershipSnap = await db.doc(`users/${uid}/company_memberships/${companyId}`).get();
  if (!membershipSnap.exists) return null;

  const techSnap = await db.collection("technicians").doc(uid).get();
  const tech = techSnap.exists ? (techSnap.data() as Record<string, unknown>) : null;

  return buildStaffMember(db, auth, companyId, uid, membershipSnap.data() ?? {}, tech);
}

async function listMembersFromTechnicians(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<CompanyStaffMember[]> {
  const techSnap = await db.collection("technicians").where("companyId", "==", companyId).get();
  const members: CompanyStaffMember[] = [];

  for (const techDoc of techSnap.docs) {
    const member = await loadMemberByUid(db, auth, companyId, techDoc.id);
    if (member) {
      members.push(member);
    }
  }

  return members;
}

async function listMembersFromMembershipGroup(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string,
  knownUids: Set<string>
): Promise<CompanyStaffMember[]> {
  const membershipSnap = await db
    .collectionGroup("company_memberships")
    .where(FieldPath.documentId(), "==", companyId)
    .get();

  const members: CompanyStaffMember[] = [];

  for (const membershipDoc of membershipSnap.docs) {
    const uid = membershipDoc.ref.parent.parent?.id;
    if (!uid || knownUids.has(uid)) continue;

    const techSnap = await db.collection("technicians").doc(uid).get();
    const tech = techSnap.exists ? (techSnap.data() as Record<string, unknown>) : null;
    members.push(await buildStaffMember(db, auth, companyId, uid, membershipDoc.data(), tech));
    knownUids.add(uid);
  }

  return members;
}

/** Liste les membres d'une société (memberships + profil technicien optionnel). */
export async function listCompanyStaff(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<CompanyStaffMember[]> {
  const knownUids = new Set<string>();
  const members: CompanyStaffMember[] = [];

  for (const member of await listMembersFromTechnicians(db, auth, companyId)) {
    members.push(member);
    knownUids.add(member.uid);
  }

  try {
    members.push(...(await listMembersFromMembershipGroup(db, auth, companyId, knownUids)));
  } catch (error) {
    if (!isFirestoreIndexError(error)) throw error;
  }

  const companySnap = await db.collection("companies").doc(companyId).get();
  const createdByUid =
    typeof companySnap.data()?.createdByUid === "string"
      ? companySnap.data()!.createdByUid.trim()
      : "";
  if (createdByUid && !knownUids.has(createdByUid)) {
    const creator = await loadMemberByUid(db, auth, companyId, createdByUid);
    if (creator) members.push(creator);
  }

  return members.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
}
