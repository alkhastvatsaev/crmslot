import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore, isConfigured } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";
import type { RequesterProfile } from "@/features/interventions/context/RequesterHubContext";

export type ClientPortalAccountFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
};

export function emptyClientPortalAccountFields(): ClientPortalAccountFields {
  return {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  };
}

function readStringField(data: Record<string, unknown> | undefined, key: string): string {
  const v = data?.[key];
  return typeof v === "string" ? v.trim() : "";
}

/** Lit uniquement les champs explicitement enregistrés — pas de déduction depuis displayName. */
export function parseClientPortalAccountDoc(
  data: Record<string, unknown> | undefined,
  authEmail?: string | null
): ClientPortalAccountFields {
  return {
    firstName: readStringField(data, "firstName"),
    lastName: readStringField(data, "lastName"),
    email: readStringField(data, "email") || authEmail?.trim() || "",
    phone: readStringField(data, "phone"),
    address: readStringField(data, "address"),
  };
}

/** Nouveau compte ou profil vide : champs vides sauf l'e-mail Auth. */
export function resolveClientPortalAccountFields(
  loaded: ClientPortalAccountFields | null,
  authEmail?: string | null
): ClientPortalAccountFields {
  if (loaded) {
    return {
      ...loaded,
      email: loaded.email || authEmail?.trim() || "",
    };
  }
  return {
    ...emptyClientPortalAccountFields(),
    email: authEmail?.trim() || "",
  };
}

export function validateClientPortalAccountFields(
  fields: ClientPortalAccountFields
): Array<keyof ClientPortalAccountFields> {
  const missing: Array<keyof ClientPortalAccountFields> = [];
  if (!fields.firstName.trim()) missing.push("firstName");
  if (!fields.lastName.trim()) missing.push("lastName");
  if (!fields.phone.trim()) missing.push("phone");
  return missing;
}

export function resolveAccountFieldsForSubmit(
  clientAccountFields: ClientPortalAccountFields | null,
  profile: RequesterProfile,
  authEmail?: string | null
): ClientPortalAccountFields {
  if (clientAccountFields) {
    return {
      ...clientAccountFields,
      email: clientAccountFields.email.trim() || authEmail?.trim() || profile.email.trim(),
    };
  }
  return accountFieldsFromRequesterProfile({
    ...profile,
    email: profile.email.trim() || authEmail?.trim() || "",
  });
}

export function accountFieldsFromRequesterProfile(
  profile: RequesterProfile
): ClientPortalAccountFields {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    address: profile.usualAddress,
  };
}

export function mergeRequesterProfileFromAccount(
  profile: RequesterProfile,
  account: ClientPortalAccountFields
): RequesterProfile {
  return {
    ...profile,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email.trim() || profile.email,
    phone: account.phone,
    usualAddress: account.address,
  };
}

export async function loadClientPortalAccountFields(
  uid: string,
  authEmail?: string | null
): Promise<ClientPortalAccountFields | null> {
  if (!isConfigured || !firestore) return null;

  try {
    const snap = await getDoc(doc(firestore, CLIENT_PORTAL_PROFILE_COLLECTION, uid));
    if (!snap.exists()) return null;
    return parseClientPortalAccountDoc(snap.data() as Record<string, unknown>, authEmail);
  } catch (e) {
    logger.error("[loadClientPortalAccountFields] Firestore read failed", {
      error: e instanceof Error ? e.message : String(e),
      uid,
    });
    return null;
  }
}

export async function saveClientPortalAccountFields(
  uid: string,
  fields: ClientPortalAccountFields
): Promise<void> {
  if (!isConfigured || !firestore) return;

  const firstName = fields.firstName.trim();
  const lastName = fields.lastName.trim();
  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  try {
    await setDoc(
      doc(firestore, CLIENT_PORTAL_PROFILE_COLLECTION, uid),
      {
        firstName: firstName || null,
        lastName: lastName || null,
        phone: fields.phone.trim() || null,
        address: fields.address.trim() || null,
        email: fields.email.trim() || null,
        displayName: displayName || null,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    logger.error("[saveClientPortalAccountFields] Firestore write failed", {
      error: e instanceof Error ? e.message : String(e),
      uid,
    });
    throw e;
  }
}
