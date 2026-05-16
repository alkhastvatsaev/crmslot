/**
 * Prévisualisation UI avec données démo (missions du jour, Demandes, Rapports mock, etc.).
 *
 * | Contexte | Activé ? |
 * |----------|----------|
 * | `npm run dev` | Oui |
 * | Vercel sans variable staging | **Non** → listes vides sans tenant / dossiers Firestore |
 * | Vercel + `NEXT_PUBLIC_STAGING_PREVIEW=true` | Oui (même ressenti que le local) |
 *
 * Désactiver : `NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW=true`.
 *
 * **Profils** : pas basé sur l’IP. Firebase Auth anonyme = un UID **par navigateur**.
 * Les missions démo sont **partagées** entre testeurs ; seuls les vrais dossiers Firestore sont isolés par projet / règles.
 */
export const stagingPreviewEnabled =
  process.env.NEXT_PUBLIC_STAGING_PREVIEW === "true";

export const devUiPreviewEnabled =
  (process.env.NODE_ENV === "development" ||
    stagingPreviewEnabled ||
    process.env.NEXT_PUBLIC_FORCE_DEV_UI_PREVIEW === "true") &&
  process.env.NEXT_PUBLIC_DISABLE_DEV_UI_PREVIEW !== "true";

const inDevOrPreview = devUiPreviewEnabled;

/**
 * Masque missions / grilles générées (carte, technicien démo, etc.) et fichiers locaux `.intervention.json`.
 *
 * - **Développement / staging preview** : démos visibles par défaut (`NEXT_PUBLIC_HIDE_DEMO_MISSIONS=true` pour les cacher).
 * - **Production réelle** : `NEXT_PUBLIC_REAL_INTERVENTIONS_ONLY=true`.
 */
export const realInterventionsOnly =
  process.env.NEXT_PUBLIC_REAL_INTERVENTIONS_ONLY === "true" ||
  (inDevOrPreview && process.env.NEXT_PUBLIC_HIDE_DEMO_MISSIONS === "true");

const LEGACY_SEED_INTERVENTION_IDS = new Set(["1", "2", "3", "demo-mission-backoffice-only"]);

export function isSyntheticInterventionId(id: string): boolean {
  if (!id) return false;
  if (LEGACY_SEED_INTERVENTION_IDS.has(id)) return true;
  return id.startsWith("mock-day-");
}

/** Retire les dossiers seed / mock connus (toute source, surtout Firestore). */
export function stripKnownSyntheticInterventions<T extends { id: string }>(rows: T[]): T[] {
  return rows.filter((r) => !isSyntheticInterventionId(r.id));
}

/** @deprecated alias de {@link stripKnownSyntheticInterventions} */
export function excludeSyntheticInterventions<T extends { id: string }>(rows: T[]): T[] {
  return stripKnownSyntheticInterventions(rows);
}

export const DEMO_COMPANY_ID = "demo-local-company";

/** UID fictif : sessions anonymes dev utilisent ces dossiers comme missions « MANSOUR » (voir UserProfile). */
export const DEMO_TECHNICIAN_UID = "demo-tech-local";
