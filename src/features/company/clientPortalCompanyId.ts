import type { CompanyWorkspaceApi } from "@/context/CompanyWorkspaceContext";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";

/** Même logique que `devUiPreviewEnabled`, évaluée à l'appel (tests + staging Vercel). */
function isStagingStylePreviewActive(): boolean {
  if (process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW === "true") return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_STAGING_PREVIEW === "true" ||
    process.env.NEXT_PUBLIC_FORCE_DEV_UI_PREVIEW === "true"
  );
}

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

/**
 * Société Firestore pour une nouvelle demande client.
 * N'utilise jamais `demo-local-company` : en staging Vercel sans env, l'admin ne voyait pas les dossiers.
 */
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
 * Sociétés à écouter dans l'inbox IVANA (carte / dispatch).
 * Inclut la société portail par défaut si l'admin y appartient, et `demo-local-company` en preview staging
 * pour récupérer les demandes créées avant correction ou sans env.
 */
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

  if (isStagingStylePreviewActive() && membershipIds.size > 0) {
    ids.add(DEMO_COMPANY_ID);
  }

  if (ids.size === 0 && active) ids.add(active);

  return [...ids];
}
