import { randomBytes } from "node:crypto";
import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { CreateCompanyStaffInput, CreateCompanyStaffResult } from "@/features/teamHub/types";
import {
  companyStaffKindNeedsTechnicianProfile,
  companyStaffKindToMembershipRole,
} from "@/features/teamHub/resolveCompanyStaffKind";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";
import { provisionTechnicianStaffRecord } from "@/features/company/server/provisionTechnicianStaff";
import { syncTenantClaims } from "@/features/company/server/syncTenantClaims";

function isAuthUserNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "auth/user-not-found"
  );
}

async function attachStaffToCompany(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  params: {
    companyId: string;
    companyName: string;
    uid: string;
    input: CreateCompanyStaffInput;
  }
): Promise<{ alreadyMember: boolean }> {
  const membershipRole = companyStaffKindToMembershipRole(params.input.staffKind);
  const membershipRef = db.doc(`users/${params.uid}/company_memberships/${params.companyId}`);
  const existingMembership = await membershipRef.get();
  const alreadyMember = existingMembership.exists;

  if (!existingMembership.exists) {
    await membershipRef.set({
      companyId: params.companyId,
      role: membershipRole,
      joinedAt: FieldValue.serverTimestamp(),
      companyName: params.companyName,
      active: true,
    });
  } else if (
    params.input.staffKind === "dirigeant" &&
    (existingMembership.data()?.role as string) !== "admin"
  ) {
    await membershipRef.update({ role: "admin" });
  }

  await upsertCompanyStaffDirectoryEntry(db, params.companyId, params.uid, membershipRole);

  if (companyStaffKindNeedsTechnicianProfile(params.input.staffKind)) {
    await provisionTechnicianStaffRecord(
      db,
      {
        uid: params.uid,
        companyId: params.companyId,
        profile: {
          firstName: params.input.firstName,
          lastName: params.input.lastName,
          email: params.input.email ?? null,
        },
      },
      { auth }
    );
  }

  await syncTenantClaims(auth, db, params.uid, params.companyId);

  return { alreadyMember };
}

/** Crée ou invite un employé (admin société). E-mail → compte Auth ; téléphone → invitation. */
export async function createCompanyStaffMember(
  db: admin.firestore.Firestore,
  auth: typeof admin.auth,
  companyId: string,
  actorUid: string,
  input: CreateCompanyStaffInput
): Promise<CreateCompanyStaffResult> {
  const trimmedCompanyId = companyId.trim();
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = (input.phone ?? "").trim();

  if (!trimmedCompanyId) {
    return { ok: false, status: 400, error: "Identifiant société requis." };
  }
  if (!firstName) {
    return { ok: false, status: 400, error: "Prénom requis." };
  }
  if (!email && !phone) {
    return { ok: false, status: 400, error: "E-mail ou téléphone requis." };
  }
  if (
    input.staffKind !== "dirigeant" &&
    input.staffKind !== "dispatcher" &&
    input.staffKind !== "technician"
  ) {
    return { ok: false, status: 400, error: "Rôle invalide." };
  }

  const companySnap = await db.collection("companies").doc(trimmedCompanyId).get();
  if (!companySnap.exists) {
    return { ok: false, status: 404, error: "Société introuvable." };
  }
  const companyName =
    typeof companySnap.data()?.name === "string" ? (companySnap.data()?.name as string) : "Société";

  if (email) {
    let uid: string;
    let created = false;
    let passwordResetLink: string | undefined;

    try {
      const existing = await auth().getUserByEmail(email);
      uid = existing.uid;
    } catch (error) {
      if (!isAuthUserNotFound(error)) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message.trim()
            : "Impossible de créer le compte.";
        return { ok: false, status: 500, error: message };
      }

      const displayName = [firstName, lastName].filter(Boolean).join(" ");
      const password = randomBytes(24).toString("base64url");
      const record = await auth().createUser({
        email,
        displayName: displayName || undefined,
        password,
      });
      uid = record.uid;
      created = true;

      try {
        passwordResetLink = await auth().generatePasswordResetLink(email);
      } catch {
        /* lien optionnel */
      }
    }

    const { alreadyMember } = await attachStaffToCompany(db, auth, {
      companyId: trimmedCompanyId,
      companyName,
      uid,
      input: { ...input, firstName, lastName, email },
    });

    return {
      ok: true,
      mode: "member",
      uid,
      created,
      alreadyMember,
      passwordResetLink,
    };
  }

  const membershipRole = companyStaffKindToMembershipRole(input.staffKind);
  const inviteRef = await db.collection("company_invites").add({
    companyId: trimmedCompanyId,
    phone,
    role: membershipRole,
    staffKind: input.staffKind,
    firstName,
    lastName,
    createdAt: FieldValue.serverTimestamp(),
    invitedByUid: actorUid.trim(),
  });

  return { ok: true, mode: "invite", inviteId: inviteRef.id };
}
