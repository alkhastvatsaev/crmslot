import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";

/** Société cible des demandes portail client (`NEXT_PUBLIC_*`, build-time). */
export function readClientPortalDefaultCompanyIdFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID;
  return typeof raw === "string" ? raw.trim() : "";
}

export type ResolveClientPortalInterventionCompanyIdInput = {
  tenantActiveCompanyId?: string | null;
  /** Profil portail / whitelist téléphone — après la société tenant active. */
  linkedPortalCompanyId?: string | null;
};

/** Société Firestore pour une nouvelle demande client (jamais de société fictive). */
export function resolveClientPortalInterventionCompanyId(
  input: ResolveClientPortalInterventionCompanyIdInput
): string | null {
  const tenant = (input.tenantActiveCompanyId ?? "").trim();
  if (tenant) return tenant;

  const linked = (input.linkedPortalCompanyId ?? "").trim();
  if (linked) return linked;

  const envDefault = readClientPortalDefaultCompanyIdFromEnv();
  if (envDefault) return envDefault;

  return null;
}

/**
 * Société du chat portail — source unique client + staff.
 * En phase test (`NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID`), l’env prime sur un
 * profil portail périmé (ex. ancienne société ABC supprimée).
 */
export function resolvePortalChatCompanyId(linkedPortalCompanyId?: string | null): string | null {
  const envDefault = readClientPortalDefaultCompanyIdFromEnv();
  if (envDefault) return envDefault;

  const linked = (linkedPortalCompanyId ?? "").trim();
  if (linked) return linked;

  return null;
}

/** Sociétés Firestore à écouter pour le chat inbox staff (aligné sur `resolvePortalChatCompanyId`). */
export function resolvePortalChatInboxCompanyIds(
  workspace:
    | Pick<CompanyWorkspaceApi, "isTenantUser" | "activeCompanyId" | "memberships">
    | null
    | undefined
): string[] {
  if (!workspace?.isTenantUser) return [];

  const envDefault = readClientPortalDefaultCompanyIdFromEnv();
  if (envDefault) return [envDefault];

  return resolveBackofficeInboxCompanyIds(workspace);
}

/** Sociétés à écouter dans l'inbox chat portail (carte / dispatch). */
export function resolveBackofficeInboxCompanyIds(
  workspace:
    | Pick<CompanyWorkspaceApi, "isTenantUser" | "activeCompanyId" | "memberships">
    | null
    | undefined
): string[] {
  if (!workspace?.isTenantUser) return [];

  const membershipIds = [
    ...new Set(workspace.memberships.map((m) => m.companyId.trim()).filter(Boolean)),
  ];
  if (membershipIds.length === 0) return [];

  const active = workspace.activeCompanyId.trim();
  const envDefault = readClientPortalDefaultCompanyIdFromEnv();

  const ids = new Set<string>();
  if (active && membershipIds.includes(active)) ids.add(active);
  if (envDefault && membershipIds.includes(envDefault)) ids.add(envDefault);

  if (ids.size === 0) {
    for (const companyId of membershipIds) ids.add(companyId);
  }

  return [...ids];
}
