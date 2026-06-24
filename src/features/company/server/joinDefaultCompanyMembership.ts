import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  provisionTechnicianStaffRecord,
  type TechnicianStaffProfile,
} from "@/features/company/server/provisionTechnicianStaff";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
import { syncTenantClaims } from "@/features/company/server/syncTenantClaims";
import { readDefaultStaffCompanyIdFromEnv } from "@/features/company/server/readDefaultStaffCompanyId";

export type JoinDefaultCompanyOptions = {
  staffKind?: "admin" | "technician";
  technicianProfile?: TechnicianStaffProfile;
};

export type JoinDefaultCompanyResult =
  | { ok: true; companyId: string; alreadyMember: boolean }
  | { ok: false; status: number; error: string };

async function resolveTechnicianProfile(
  auth: typeof admin.auth,
  uid: string,
  profile?: TechnicianStaffProfile
): Promise<TechnicianStaffProfile> {
  const base = profile ?? {};
  if ((base.email ?? "").trim()) return base;
  try {
    const userRecord = await auth().getUser(uid);
    return { ...base, email: userRecord.email ?? null };
  } catch {
    return base;
  }
}

/** Attache un compte staff à la société unique configurée (Admin SDK). */
export async function joinDefaultCompanyMembership(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  uid: string,
  options?: JoinDefaultCompanyOptions
): Promise<JoinDefaultCompanyResult> {
  const staffKind = options?.staffKind === "technician" ? "technician" : "admin";
  const companyId = readDefaultStaffCompanyIdFromEnv();
  if (!companyId) {
    return {
      ok: false,
      status: 503,
      error: "Société par défaut non configurée (NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID).",
    };
  }

  const companySnap = await db.collection("companies").doc(companyId).get();
  if (!companySnap.exists) {
    return { ok: false, status: 404, error: "Société introuvable." };
  }

  const companyName =
    typeof companySnap.data()?.name === "string" ? (companySnap.data()?.name as string) : "Société";

  const membershipRef = db.doc(`users/${uid}/company_memberships/${companyId}`);
  const existing = await membershipRef.get();
  const membershipRole = staffKind === "technician" ? "collaborateur" : "admin";

  if (!existing.exists) {
    await membershipRef.set({
      companyId,
      role: membershipRole,
      joinedAt: FieldValue.serverTimestamp(),
      companyName,
    });
  } else if (staffKind === "admin" && (existing.data()?.role as string) !== "admin") {
    await membershipRef.update({ role: "admin" });
  }

  await upsertCompanyStaffDirectoryEntry(db, companyId, uid, membershipRole);

  if (staffKind === "technician") {
    const profile = await resolveTechnicianProfile(auth, uid, options?.technicianProfile);
    await provisionTechnicianStaffRecord(db, { uid, companyId, profile });
  }

  await syncTenantClaims(auth, db, uid, companyId);

  return { ok: true, companyId, alreadyMember: existing.exists };
}
