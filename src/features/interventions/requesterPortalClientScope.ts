import type { User } from "firebase/auth";
import type { RequesterProfile } from "@/context/RequesterHubContext";

export type ClientPortalIdentity = {
  uid: string | null;
  isAnonymous: boolean;
  requiresLogin: boolean;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
};

export type ClientPortalInterventionRow = {
  id: string;
  clientEmail?: string | null;
  clientFirstName?: string | null;
  clientLastName?: string | null;
  clientCompanyName?: string | null;
  clientPhone?: string | null;
  createdAt?: string | null;
};

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

export function resolveClientPortalIdentity(
  user: User | null,
  profile: Pick<
    RequesterProfile,
    "type" | "firstName" | "lastName" | "phone" | "email" | "companyName"
  >
): ClientPortalIdentity {
  const isAnonymous = !user || user.isAnonymous;
  const emailVerified = Boolean(user && !user.isAnonymous && user.emailVerified);
  const requiresLogin =
    (profile.type === "login" || profile.type === "register") && (isAnonymous || !emailVerified);
  const authEmail = !isAnonymous && user?.email ? user.email.trim() : "";

  return {
    uid: user?.uid ?? null,
    isAnonymous,
    requiresLogin,
    email: authEmail || profile.email.trim(),
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    phone: profile.phone.trim(),
    companyName: profile.companyName.trim(),
  };
}

export function canResolveClientPortalIdentity(identity: ClientPortalIdentity): boolean {
  if (identity.requiresLogin) return false;
  if (!identity.isAnonymous && identity.email.length > 0) return true;
  if (identity.companyName.length > 0) return true;
  if (identity.lastName.length > 0 && identity.firstName.length > 0) return true;
  if (identity.lastName.length > 0 && identity.phone.length > 0) return true;
  return false;
}

export function interventionBelongsToClientPortalIdentity(
  intervention: ClientPortalInterventionRow,
  identity: ClientPortalIdentity
): boolean {
  if (!canResolveClientPortalIdentity(identity)) return false;

  if (!identity.isAnonymous && identity.email) {
    const ivEmail = (intervention.clientEmail ?? "").trim().toLowerCase();
    if (ivEmail) {
      return ivEmail === identity.email.toLowerCase();
    }
  }

  if (identity.companyName) {
    return normalizeName(intervention.clientCompanyName) === normalizeName(identity.companyName);
  }

  const ivLast = normalizeName(intervention.clientLastName);
  const ivFirst = normalizeName(intervention.clientFirstName);
  const idLast = normalizeName(identity.lastName);
  const idFirst = normalizeName(identity.firstName);

  if (idLast && ivLast && idLast !== ivLast) return false;
  if (idFirst && ivFirst && idFirst !== ivFirst) return false;
  if (idLast && !ivLast) return false;

  const idPhone = normalizePhone(identity.phone);
  if (idPhone) {
    const ivPhone = normalizePhone(intervention.clientPhone);
    if (ivPhone && idPhone !== ivPhone) return false;
  }

  return idLast.length > 0 || idFirst.length > 0;
}

export function filterInterventionsForClientPortal<T extends ClientPortalInterventionRow>(
  interventions: T[],
  identity: ClientPortalIdentity
): T[] {
  return interventions.filter((row) => interventionBelongsToClientPortalIdentity(row, identity));
}
