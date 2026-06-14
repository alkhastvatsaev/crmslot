import { generatePortalAccessCode } from "./portalAccessCode";
import { generatePortalAccessToken } from "./portalToken";

/** Champs portail client : lien `/suivi/[token]` + code d'accès court. */
export function portalAccessFields(): { portalAccessToken: string; portalAccessCode: string } {
  return {
    portalAccessToken: generatePortalAccessToken(),
    portalAccessCode: generatePortalAccessCode(),
  };
}

/** @deprecated Préférer `portalAccessFields()` */
export function portalAccessTokenField(): { portalAccessToken: string; portalAccessCode: string } {
  return portalAccessFields();
}

/** Enrichit un payload Firestore (client ou Admin SDK) avec un token portail. */
export function withPortalAccessToken<T extends Record<string, unknown>>(
  data: T
): T & { portalAccessToken: string } {
  return { ...data, portalAccessToken: generatePortalAccessToken() };
}
