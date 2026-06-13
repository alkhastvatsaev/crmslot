/** URL publique de l'app (liens portail, Stripe, e-mails, crons). */
export function resolvePublicAppBaseUrl(
  env: Record<string, string | undefined> = process.env
): string {
  const fromPublic = env.PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  if (fromPublic) return fromPublic;
  const fromNext = env.NEXT_PUBLIC_BASE_URL?.trim()?.replace(/\/$/, "");
  if (fromNext) return fromNext;
  const vercel = env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function buildPortalSuiviUrl(portalAccessToken: string): string {
  const token = portalAccessToken.trim();
  return `${resolvePublicAppBaseUrl()}/suivi/${encodeURIComponent(token)}`;
}
