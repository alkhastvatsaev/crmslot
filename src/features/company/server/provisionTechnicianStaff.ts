import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { upsertCompanyStaffDirectoryEntry } from "@/features/company/server/companyStaffDirectory";

export type TechnicianStaffProfile = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
};

const DEFAULT_LOCATION = { lat: 50.8466, lng: 4.3522 };

function splitDisplayName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export async function enrichTechnicianProfileFromAuth(
  auth: typeof admin.auth,
  uid: string,
  profile: TechnicianStaffProfile
): Promise<TechnicianStaffProfile> {
  const firstName = (profile.firstName ?? "").trim();
  const lastName = (profile.lastName ?? "").trim();
  const email = (profile.email ?? "").trim();
  if (firstName && lastName && email) return profile;

  try {
    const user = await auth().getUser(uid);
    const displayName = user.displayName?.trim() ?? "";
    const fromName = splitDisplayName(displayName);
    return {
      firstName: firstName || fromName.firstName,
      lastName: lastName || fromName.lastName,
      email: email || user.email?.trim() || null,
    };
  } catch {
    return profile;
  }
}

export function buildTechnicianDisplayName(profile: TechnicianStaffProfile): string {
  const firstName = (profile.firstName ?? "").trim();
  const lastName = (profile.lastName ?? "").trim();
  const full = [firstName, lastName].filter(Boolean).join(" ");
  if (full) return full;

  const email = (profile.email ?? "").trim();
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  return "Technicien";
}

export function technicianInitialFromName(name: string): string {
  return (name.trim().charAt(0) || "T").toUpperCase();
}

/** Crée ou met à jour `technicians/{uid}` avec `authUid` pour assignation admin + missions terrain. */
export async function provisionTechnicianStaffRecord(
  db: admin.firestore.Firestore,
  params: { uid: string; companyId: string; profile: TechnicianStaffProfile },
  options?: { auth?: typeof admin.auth }
): Promise<void> {
  let profile = params.profile;
  if (options?.auth) {
    profile = await enrichTechnicianProfileFromAuth(options.auth, params.uid, profile);
  }
  const name = buildTechnicianDisplayName(profile);
  const ref = db.collection("technicians").doc(params.uid);
  const existing = await ref.get();
  const existingData = existing.data() ?? {};

  const patch: Record<string, unknown> = {
    authUid: params.uid,
    companyId: params.companyId,
    name,
    initial: technicianInitialFromName(name),
    status: existingData.status ?? "available",
    vehicle: existingData.vehicle ?? "Camionnette",
    location: existingData.location ?? DEFAULT_LOCATION,
    active: existingData.active !== false,
    updatedAt: FieldValue.serverTimestamp(),
  };

  const firstName = (profile.firstName ?? "").trim();
  const lastName = (profile.lastName ?? "").trim();
  if (firstName) patch.firstName = firstName;
  if (lastName) patch.lastName = lastName;

  const email = (profile.email ?? "").trim();
  if (email) patch.email = email;

  if (!existing.exists) {
    await ref.set({ ...patch, createdAt: FieldValue.serverTimestamp() });
  } else {
    await ref.set(patch, { merge: true });
  }

  await upsertCompanyStaffDirectoryEntry(db, params.companyId, params.uid, "collaborateur");
}
