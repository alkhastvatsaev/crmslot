/** Extrait l'interventionId d'un `requestId` mock (`mock-sign-{id}-{ts}`). */
export function parseMockSignRequestId(requestId: string): string | null {
  const prefix = "mock-sign-";
  const trimmed = requestId.trim();
  if (!trimmed.startsWith(prefix)) return null;
  const rest = trimmed.slice(prefix.length);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const ts = rest.slice(lastDash + 1);
  if (!/^\d+$/.test(ts)) return null;
  const interventionId = rest.slice(0, lastDash).trim();
  return interventionId || null;
}
