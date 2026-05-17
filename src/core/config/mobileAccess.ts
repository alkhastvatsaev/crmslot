/**
 * Autorise l’app sur téléphone (hub technicien / tests terrain).
 * Staging : `NEXT_PUBLIC_ALLOW_MOBILE=true`
 * Prod : n’activer qu’après validation Phase 3–4 du plan stratégique.
 */
export const mobileAccessAllowed =
  process.env.NEXT_PUBLIC_ALLOW_MOBILE === "true" ||
  process.env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN === "true";
