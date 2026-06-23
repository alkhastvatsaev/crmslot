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

/** Sociétés à écouter dans l'inbox chat portail (carte / dispatch). */
export function resolveBackofficeInboxCompanyIds(
  workspace:
    | Pick<CompanyWorkspaceApi, "isTenantUser" | "activeCompanyId" | "memberships">
    | null
    | undefined
): string[] {
  if (!workspace?.isTenantUser) return [];

  const membershipIds = new Set(
    workspace.memberships.map((m) => m.companyId.trim()).filter(Boolean)
  );
  const active = workspace.activeCompanyId.trim();
  const envDefault = readClientPortalDefaultCompanyIdFromEnv();

  const ids = new Set<string>();
  if (active && membershipIds.has(active)) ids.add(active);
  if (envDefault && membershipIds.has(envDefault)) ids.add(envDefault);

  if (ids.size === 0 && active) ids.add(active);

  return [...ids];
}
