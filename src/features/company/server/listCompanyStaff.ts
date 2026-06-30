import type * as admin from "firebase-admin";
import type { CompanyStaffMember } from "@/features/teamHub";
import { stripLegacyDemoTechnicians } from "@/core/config/legacyDemoTechnicians";
import { buildTechnicianDisplayName } from "@/features/company/server/provisionTechnicianStaff";
import { batchedFirestoreGetAll } from "@/features/company/server/batchedFirestoreGetAll";
import { listStaffDirectoryUids } from "@/features/company/server/companyStaffDirectory";

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

type TechnicianRow = Record<string, unknown> | null | undefined;

function buildStaffMember(
  companyId: string,
  uid: string,
  membershipData: Record<string, unknown>,
  techData: TechnicianRow,
  authUser?: admin.auth.UserRecord | null
): CompanyStaffMember {
  const role = (membershipData.role as string) === "admin" ? "admin" : "collaborateur";
  const membershipActive = membershipData.active !== false;

  const tech = techData ?? null;
  const techCompanyId = typeof tech?.companyId === "string" ? tech.companyId.trim() : "";
  const hasTechnicianProfile = Boolean(tech) && (!techCompanyId || techCompanyId === companyId);

  const email =
    (typeof tech?.email === "string" ? tech.email.trim() : "") || authUser?.email?.trim() || "";
  const authDisplayName = authUser?.displayName?.trim() ?? "";

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

function staffRowNeedsAuthLookup(techData: TechnicianRow): boolean {
  const tech = techData ?? null;
  const hasEmail = typeof tech?.email === "string" && tech.email.trim().length > 0;
  const hasDisplayName =
    (typeof tech?.firstName === "string" && tech.firstName.trim().length > 0) ||
    (typeof tech?.lastName === "string" && tech.lastName.trim().length > 0) ||
    (typeof tech?.name === "string" && tech.name.trim().length > 0);
  return !hasEmail || !hasDisplayName;
}

async function loadAuthUsersByUid(
  auth: typeof admin.auth,
  uids: string[],
  techByUid: Map<string, Record<string, unknown>>
): Promise<Map<string, admin.auth.UserRecord>> {
  const byUid = new Map<string, admin.auth.UserRecord>();
  const uniqueUids = [
    ...new Set(uids.filter((uid) => uid && staffRowNeedsAuthLookup(techByUid.get(uid)))),
  ];
  if (uniqueUids.length === 0) return byUid;

  for (let offset = 0; offset < uniqueUids.length; offset += 100) {
    const chunk = uniqueUids.slice(offset, offset + 100);
    try {
      const batch = await auth().getUsers(chunk.map((uid) => ({ uid })));
      for (const user of batch.users) {
        byUid.set(user.uid, user);
      }
    } catch {
      await Promise.all(
        chunk.map(async (uid) => {
          try {
            const user = await auth().getUser(uid);
            byUid.set(uid, user);
          } catch {
            /* compte Auth supprimé */
          }
        })
      );
    }
  }

  return byUid;
}

function membershipUidFromSnap(snap: admin.firestore.DocumentSnapshot): string | null {
  return snap.ref.parent?.parent?.id ?? null;
}

/** Liste les membres d'une société (memberships + profil technicien optionnel). */
export async function listCompanyStaff(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string
): Promise<CompanyStaffMember[]> {
  const [techSnap, directoryUids, companySnap] = await Promise.all([
    db.collection("technicians").where("companyId", "==", companyId).get(),
    listStaffDirectoryUids(db, companyId),
    db.collection("companies").doc(companyId).get(),
  ]);

  const techByUid = new Map<string, Record<string, unknown>>();
  for (const techDoc of techSnap.docs) {
    techByUid.set(techDoc.id, techDoc.data());
  }

  const allUids = new Set<string>([...techByUid.keys(), ...directoryUids]);
  const createdByUid =
    typeof companySnap.data()?.createdByUid === "string"
      ? companySnap.data()!.createdByUid.trim()
      : "";
  if (createdByUid) allUids.add(createdByUid);

  const uids = [...allUids];
  if (uids.length === 0) return [];

  const missingTechUids = uids.filter((uid) => !techByUid.has(uid));
  if (missingTechUids.length > 0) {
    const missingTechSnaps = await batchedFirestoreGetAll(
      db,
      missingTechUids.map((uid) => db.collection("technicians").doc(uid))
    );
    for (const snap of missingTechSnaps) {
      if (snap.exists) {
        techByUid.set(snap.id, snap.data() ?? {});
      }
    }
  }

  const membershipSnaps = await batchedFirestoreGetAll(
    db,
    uids.map((uid) => db.doc(`users/${uid}/company_memberships/${companyId}`))
  );
  const membershipByUid = new Map<string, Record<string, unknown>>();
  for (const snap of membershipSnaps) {
    if (!snap.exists) continue;
    const uid = membershipUidFromSnap(snap);
    if (uid) membershipByUid.set(uid, snap.data() ?? {});
  }

  const authUsers = await loadAuthUsersByUid(auth, uids, techByUid);

  const members: CompanyStaffMember[] = [];
  for (const uid of uids) {
    const membershipData = membershipByUid.get(uid);
    if (!membershipData) continue;
    members.push(
      buildStaffMember(companyId, uid, membershipData, techByUid.get(uid), authUsers.get(uid))
    );
  }

  return stripLegacyDemoTechnicians(
    members.sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"))
  );
}
