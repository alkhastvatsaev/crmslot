import { lecotApiBaseUrl } from "@/features/catalog/lecotApiSearch";
import { lecotShopCredentials } from "@/features/catalog/lecotShopConfig";

/** Playwright recherche lecot.be — opt-in (`LECOT_PLAYWRIGHT_SEARCH=true` + `npx playwright install`). */
export function lecotPlaywrightSearchEnabled(): boolean {
  return process.env.LECOT_PLAYWRIGHT_SEARCH === "true";
}

/** Playwright passage commande sur lecot.be (très lent) — désactivé par défaut. */
export function lecotPlaywrightOrderEnabled(): boolean {
  return process.env.LECOT_PLAYWRIGHT_ORDER === "true";
}

/** API, Playwright commande ou identifiants shop configurés. */
export function lecotRealOrderChannelConfigured(): boolean {
  return (
    Boolean(lecotApiBaseUrl()) ||
    lecotPlaywrightOrderEnabled() ||
    lecotShopCredentials() !== null
  );
}

/**
 * Simulation commande Lecot (panneau droit + statut « envoyé » démo).
 * Activé par défaut tant qu'aucun canal réel n'est configuré ; `LECOT_DEMO_ORDERS=false` pour couper.
 */
export function lecotDemoOrdersEnabled(): boolean {
  // Par défaut en mode démo (simulation), sauf désactivation explicite
  if (process.env.LECOT_DEMO_ORDERS === "false") return false;
  return true;
}
