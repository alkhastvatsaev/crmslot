/**
 * Floute noms / photos / audio en démo commerciale.
 * - Prod réelle : `NEXT_PUBLIC_PRESENTATION_PRIVACY_MODE=false` (défaut).
 * - Démo / staging : `NEXT_PUBLIC_PRESENTATION_PRIVACY_MODE=true`.
 */
export const PRESENTATION_PRIVACY_MODE =
  process.env.NEXT_PUBLIC_PRESENTATION_PRIVACY_MODE === "true";
