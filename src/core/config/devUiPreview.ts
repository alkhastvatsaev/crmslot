/**
 * Prévisualisation UI sans Firebase (tenant démo, bannière staging).
 *
 * | Contexte | `devUiPreviewEnabled` |
 * |----------|------------------------|
 * | `npm run dev` | Oui |
 * | Vercel + `NEXT_PUBLIC_STAGING_PREVIEW=true` | Oui |
 * | Production | Non (sauf `NEXT_PUBLIC_FORCE_DEV_UI_PREVIEW=true`) |
 *
 * Désactiver : `NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW=true`.
 *
 * Les missions / clients fictifs (mock-day-*, generateDailyMissions, etc.) ont été retirés :
 * seules les interventions Firestore (et créations live) alimentent l’UI.
 */
export const stagingPreviewEnabled =
  process.env.NEXT_PUBLIC_STAGING_PREVIEW === "true";

export const devUiPreviewEnabled =
  (process.env.NODE_ENV === "development" ||
    stagingPreviewEnabled ||
    process.env.NEXT_PUBLIC_FORCE_DEV_UI_PREVIEW === "true") &&
  process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW !== "true";

const LEGACY_SEED_INTERVENTION_IDS = new Set(["1", "2", "3", "demo-mission-backoffice-only"]);

export function isSyntheticInterventionId(id: string): boolean {
  if (!id) return false;
  if (LEGACY_SEED_INTERVENTION_IDS.has(id)) return true;
  return id.startsWith("mock-day-");
}

/** Retire les dossiers seed / mock connus restants en base. */
export function stripKnownSyntheticInterventions<T extends { id: string }>(rows: T[]): T[] {
  return rows.filter((r) => !isSyntheticInterventionId(r.id));
}

/** @deprecated alias de {@link stripKnownSyntheticInterventions} */
export function excludeSyntheticInterventions<T extends { id: string }>(rows: T[]): T[] {
  return stripKnownSyntheticInterventions(rows);
}

/** Société fictive uniquement quand Firebase n’est pas configuré (pas de dossiers injectés). */
export const DEMO_COMPANY_ID = "demo-local-company";

/** UID Auth anonyme dev — routage technicien, pas de clients mock. */
export const DEMO_TECHNICIAN_UID = "demo-tech-local";
