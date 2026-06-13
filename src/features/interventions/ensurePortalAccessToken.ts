import { generatePortalAccessToken } from "./portalToken";

/** Champ à inclure à la création d'une intervention pour activer `/suivi/[token]`. */
export function portalAccessTokenField(): { portalAccessToken: string } {
  return { portalAccessToken: generatePortalAccessToken() };
}

/** Enrichit un payload Firestore (client ou Admin SDK) avec un token portail. */
export function withPortalAccessToken<T extends Record<string, unknown>>(
  data: T
): T & { portalAccessToken: string } {
  return { ...data, portalAccessToken: generatePortalAccessToken() };
}
