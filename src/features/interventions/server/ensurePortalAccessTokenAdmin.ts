import type * as admin from "firebase-admin";
import { generatePortalAccessToken } from "@/features/interventions/portalToken";
import type { Intervention } from "@/features/interventions/types";

/** Garantit un token portail sur le dossier (pour liens `/suivi/[token]`). */
export async function ensurePortalAccessTokenAdmin(
  db: admin.firestore.Firestore,
  interventionId: string,
  iv: Pick<Intervention, "portalAccessToken">
): Promise<string> {
  const existing = iv.portalAccessToken?.trim();
  if (existing) return existing;

  const portalAccessToken = generatePortalAccessToken();
  await db.collection("interventions").doc(interventionId).update({
    portalAccessToken,
    updatedAt: new Date().toISOString(),
  });
  return portalAccessToken;
}
