import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type TechnicianStaffProfile = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
};

const DEFAULT_LOCATION = { lat: 50.8466, lng: 4.3522 };

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
  params: { uid: string; companyId: string; profile: TechnicianStaffProfile }
): Promise<void> {
  const name = buildTechnicianDisplayName(params.profile);
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
    updatedAt: FieldValue.serverTimestamp(),
  };

  const firstName = (params.profile.firstName ?? "").trim();
  const lastName = (params.profile.lastName ?? "").trim();
  if (firstName) patch.firstName = firstName;
  if (lastName) patch.lastName = lastName;

  const email = (params.profile.email ?? "").trim();
  if (email) patch.email = email;

  if (!existing.exists) {
    await ref.set({ ...patch, createdAt: FieldValue.serverTimestamp() });
  } else {
    await ref.set(patch, { merge: true });
  }
}
