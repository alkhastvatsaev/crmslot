/**
 * Accès téléphone / PWA / WebView Capacitor.
 *
 * - Prod : actif par défaut (opt-out `NEXT_PUBLIC_ALLOW_MOBILE=false`).
 * - Dev : inactif sauf `NEXT_PUBLIC_ALLOW_MOBILE=true` ou `npm run dev:pwa`.
 * - Runtime serveur : `ALLOW_MOBILE=true|false` (API `/api/mobile/config`, sans rebuild client).
 */
export function resolveMobileAccessAllowed(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NEXT_PUBLIC_ALLOW_MOBILE === "false" || env.ALLOW_MOBILE === "false") {
    return false;
  }
  if (
    env.NEXT_PUBLIC_ALLOW_MOBILE === "true" ||
    env.NEXT_PUBLIC_ALLOW_MOBILE_TECHNICIAN === "true" ||
    env.ALLOW_MOBILE === "true"
  ) {
    return true;
  }
  return env.NODE_ENV === "production";
}
