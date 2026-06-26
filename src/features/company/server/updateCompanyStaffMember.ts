import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CompanyStaffUpdateInput } from "@/features/teamHub";
import {
  buildTechnicianDisplayName,
  technicianInitialFromName,
} from "@/features/company/server/provisionTechnicianStaff";
import { changeCompanyStaffKind } from "@/features/company/server/changeCompanyStaffKind";
import { companyStaffKindNeedsTechnicianProfile } from "@/features/teamHub/resolveCompanyStaffKind";

export type UpdateCompanyStaffResult = { ok: true } | { ok: false; status: number; error: string };

function hasActiveTechnicianProfile(
  companyId: string,
  techData: Record<string, unknown> | undefined
): boolean {
  if (!techData) return false;
  const techCompanyId = typeof techData.companyId === "string" ? techData.companyId.trim() : "";
  if (techCompanyId && techCompanyId !== companyId) return false;
  return techData.active !== false;
}

/** Met à jour le profil employé (doc technicien + displayName Auth). */
export async function updateCompanyStaffMember(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string,
  targetUid: string,
  input: CompanyStaffUpdateInput
): Promise<UpdateCompanyStaffResult> {
  const membershipSnap = await db.doc(`users/${targetUid}/company_memberships/${companyId}`).get();
  if (!membershipSnap.exists) {
    return { ok: false, status: 404, error: "Membre introuvable pour cette société." };
  }

  if (input.staffKind) {
    const kindResult = await changeCompanyStaffKind(
      db,
      auth,
      companyId,
      targetUid,
      input.staffKind,
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
      }
    );
    if (!kindResult.ok) return kindResult;
  }

  const techRef = db.collection("technicians").doc(targetUid);
  const existing = await techRef.get();
  const existingData = existing.data() ?? {};

  const firstName =
    input.firstName !== undefined
      ? input.firstName.trim()
      : typeof existingData.firstName === "string"
        ? existingData.firstName.trim()
        : "";
  const lastName =
    input.lastName !== undefined
      ? input.lastName.trim()
      : typeof existingData.lastName === "string"
        ? existingData.lastName.trim()
        : "";

  let email =
    input.email !== undefined
      ? (input.email ?? "").trim()
      : typeof existingData.email === "string"
        ? existingData.email.trim()
        : "";

  if (!email) {
    try {
      email = (await auth().getUser(targetUid)).email?.trim() ?? "";
    } catch {
      /* ignore */
    }
  }

  const name = buildTechnicianDisplayName({ firstName, lastName, email: email || null });
  const shouldMaintainTechnicianProfile =
    (input.staffKind ? companyStaffKindNeedsTechnicianProfile(input.staffKind) : false) ||
    hasActiveTechnicianProfile(companyId, existing.exists ? existingData : undefined);

  if (!shouldMaintainTechnicianProfile) {
    if (name) {
      try {
        await auth().updateUser(targetUid, { displayName: name });
      } catch {
        /* compte Auth absent */
      }
    }
    return { ok: true };
  }

  const patch: Record<string, unknown> = {
    authUid: targetUid,
    companyId,
    name,
    initial: technicianInitialFromName(name),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (firstName) patch.firstName = firstName;
  if (lastName) patch.lastName = lastName;
  if (email) patch.email = email;
  if (input.vehicle !== undefined) patch.vehicle = input.vehicle.trim() || "Camionnette";

  if (!existing.exists) {
    await techRef.set({
      ...patch,
      status: "available",
      vehicle: patch.vehicle ?? "Camionnette",
      location: { lat: 50.8466, lng: 4.3522 },
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    await techRef.set(patch, { merge: true });
  }

  if (name) {
    try {
      await auth().updateUser(targetUid, { displayName: name });
    } catch {
      /* compte Auth absent */
    }
  }

  return { ok: true };
}
