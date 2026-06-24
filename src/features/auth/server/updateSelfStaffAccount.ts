import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CompanyRole } from "@/features/company";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";
import { updateCompanyStaffMember } from "@/features/company/server/updateCompanyStaffMember";
import type { UpdateCompanyStaffResult } from "@/features/company/server/updateCompanyStaffMember";
import { isSelfServiceStaffRoleEditEnabled } from "@/features/auth/server/selfServiceStaffRoleEdit";

export type SelfStaffAccountUpdateInput = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  companyId?: string;
  role?: CompanyRole;
};

function resolveMembershipRole(data: Record<string, unknown> | undefined): CompanyRole {
  return data?.role === "admin" ? "admin" : "collaborateur";
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
  const membershipSnap = await membershipRef.get();
  if (!membershipSnap.exists) {
    return { ok: false, status: 403, error: "Société non autorisée." };
  }

  const currentRole = resolveMembershipRole(membershipSnap.data());
  if (input.role && input.role !== currentRole) {
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
    await membershipRef.update({
      role: input.role,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await upsertCompanyStaffDirectoryEntry(db, companyId, uid, input.role);
  }

  const staffResult = await updateCompanyStaffMember(db, auth, companyId, uid, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
  });
  if (!staffResult.ok) return staffResult;

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
