import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CompanyRole } from "@/features/company";
import {
  isStaffAccountRoleOption,
  resolveStaffAccountRoleOption,
  staffAccountRoleToMembershipRole,
  type StaffAccountRoleOption,
} from "@/features/auth/staffAccountRoleDisplay";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
import { provisionTechnicianStaffRecord } from "@/features/company/server/provisionTechnicianStaff";
import { syncTenantClaims } from "@/features/company/server/syncTenantClaims";
import { updateCompanyStaffMember } from "@/features/company/server/updateCompanyStaffMember";
import type { UpdateCompanyStaffResult } from "@/features/company/server/updateCompanyStaffMember";
import { isSelfServiceStaffRoleEditEnabled } from "@/features/auth/server/selfServiceStaffRoleEdit";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { readDefaultStaffCompanyIdFromEnv } from "@/features/company/server/readDefaultStaffCompanyId";
import { TEST_COMPANY_DISPLAY_NAME } from "@/features/company/resolveCompanyMembershipRows";

export type SelfStaffAccountUpdateInput = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  companyId?: string;
  accountRole?: StaffAccountRoleOption;
};

function resolveMembershipRole(data: Record<string, unknown> | undefined): CompanyRole {
  return data?.role === "admin" ? "admin" : "collaborateur";
}

async function readCurrentAccountRole(
  db: admin.firestore.Firestore,
  uid: string,
  companyId: string
): Promise<StaffAccountRoleOption> {
  const membershipSnap = await db.doc(`users/${uid}/company_memberships/${companyId}`).get();
  const membershipRole = membershipSnap.exists
    ? resolveMembershipRole(membershipSnap.data())
    : "collaborateur";

  const techSnap = await db.collection("technicians").doc(uid).get();
  const techData = techSnap.exists ? techSnap.data() : null;

  return resolveStaffAccountRoleOption(
    membershipRole,
    techData
      ? {
          active: techData.active === false ? false : true,
          companyId: typeof techData.companyId === "string" ? techData.companyId : "",
        }
      : null,
    companyId
  );
}

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

async function applyAccountRole(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  uid: string,
  companyId: string,
  accountRole: StaffAccountRoleOption,
  profile: { firstName?: string; lastName?: string; email?: string | null }
): Promise<void> {
  const membershipRole = staffAccountRoleToMembershipRole(accountRole);
  const membershipRef = db.doc(`users/${uid}/company_memberships/${companyId}`);
  const membershipSnap = await membershipRef.get();

  if (membershipSnap.exists) {
    const currentRole = resolveMembershipRole(membershipSnap.data());
    if (currentRole !== membershipRole) {
      await membershipRef.update({
        role: membershipRole,
        updatedAt: FieldValue.serverTimestamp(),
      });
      await upsertCompanyStaffDirectoryEntry(db, companyId, uid, membershipRole);
      await syncTenantClaims(auth, db, uid, companyId);
    }
  }

  if (accountRole === "technician") {
    await provisionTechnicianStaffRecord(
      db,
      {
        uid,
        companyId,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email ?? null,
        },
      },
      { auth }
    );
    await db.collection("technicians").doc(uid).set(
      {
        active: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  await deactivateTechnicianForCompany(db, uid, companyId);
}

/** Met à jour le profil staff connecté (technicien + Auth). Rôle : admin société uniquement. */
export async function updateSelfStaffAccount(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  uid: string,
  input: SelfStaffAccountUpdateInput
): Promise<UpdateCompanyStaffResult> {
  const companyId = input.companyId?.trim();
  if (!companyId) {
    return { ok: false, status: 400, error: "Société requise." };
  }

  const membershipRef = db.doc(`users/${uid}/company_memberships/${companyId}`);
  let membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) {
    const envDefaultId = readDefaultStaffCompanyIdFromEnv();
    if (envDefaultId && companyId === envDefaultId && isSelfServiceStaffRoleEditEnabled()) {
      const bootstrapRole = staffAccountRoleToMembershipRole(input.accountRole ?? "dispatcher");
      await membershipRef.set({
        companyId,
        role: bootstrapRole,
        companyName: TEST_COMPANY_DISPLAY_NAME,
        joinedAt: FieldValue.serverTimestamp(),
      });
      await upsertCompanyStaffDirectoryEntry(db, companyId, uid, bootstrapRole);
      membershipSnap = await membershipRef.get();
    } else {
      return { ok: false, status: 403, error: "Société non autorisée." };
    }
  }

  if (input.accountRole && isStaffAccountRoleOption(input.accountRole)) {
    const currentAccountRole = await readCurrentAccountRole(db, uid, companyId);
    if (input.accountRole !== currentAccountRole) {
      if (!isSelfServiceStaffRoleEditEnabled()) {
        const adminCtx = await requireCompanyAdmin(db, uid, companyId);
        if ("status" in adminCtx) {
          return {
            ok: false,
            status: 403,
            error: "Modification du rôle réservée aux administrateurs.",
          };
        }
      }

      await applyAccountRole(db, auth, uid, companyId, input.accountRole, {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      });
    }
  }

  const staffResult = await updateCompanyStaffMember(db, auth, companyId, uid, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
  });
  if (!staffResult.ok) return staffResult;

  if (input.accountRole && isStaffAccountRoleOption(input.accountRole)) {
    if (input.accountRole === "technician") {
      await db.collection("technicians").doc(uid).set(
        {
          active: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await deactivateTechnicianForCompany(db, uid, companyId);
    }
  }

  if (input.phone !== undefined) {
    await db
      .collection("technicians")
      .doc(uid)
      .set(
        {
          phone: input.phone?.trim() || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  }

  if (input.email !== undefined) {
    const email = (input.email ?? "").trim();
    try {
      const userRecord = await auth().getUser(uid);
      const currentEmail = userRecord.email?.trim() ?? "";
      if (email && email !== currentEmail) {
        await auth().updateUser(uid, { email });
      }
    } catch {
      return {
        ok: false,
        status: 409,
        error: "Changement d'e-mail : reconnectez-vous puis réessayez.",
      };
    }
  }

  return { ok: true };
}

export { readCurrentAccountRole };
