import type * as admin from "firebase-admin";
import type { Intervention } from "@/features/interventions/types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidPortalAccessToken(token: string): boolean {
  return Boolean(token?.trim()) && UUID_RE.test(token.trim());
}

/** Recherche une intervention par `portalAccessToken` (Admin SDK). */
export async function findInterventionByPortalToken(
  db: admin.firestore.Firestore,
  token: string
): Promise<Intervention | null> {
  if (!isValidPortalAccessToken(token)) return null;
  const snap = await db
    .collection("interventions")
    .where("portalAccessToken", "==", token.trim())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const docSnap = snap.docs[0]!;
  return { ...(docSnap.data() as Intervention), id: docSnap.id };
}
