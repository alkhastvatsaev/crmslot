import type * as admin from "firebase-admin";
import { readDefaultStaffCompanyIdFromEnv } from "@/features/company/server/readDefaultStaffCompanyId";
import { companyAcceptsPublicInterventions } from "@/features/backoffice/server/companyAcceptsPublicInterventions";

export type EnsurePublicInterventionsResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * Autorise les demandes particulier (anonyme) pour la société portail par défaut :
 * active `acceptsPublicInterventions` si absent (idempotent).
 */
export async function ensureCompanyAcceptsPublicInterventionsAdmin(
  db: admin.firestore.Firestore,
  companyId: string
): Promise<EnsurePublicInterventionsResult> {
  const trimmed = companyId.trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: "Société manquante." };
  }

  const ref = db.collection("companies").doc(trimmed);
  const snap = await ref.get();
  if (!snap.exists) {
    return { ok: false, status: 404, error: "Société introuvable." };
  }

  if (await companyAcceptsPublicInterventions(db, trimmed)) {
    return { ok: true };
  }

  const defaultCompanyId = readDefaultStaffCompanyIdFromEnv();
  if (defaultCompanyId && defaultCompanyId === trimmed) {
    await ref.set({ acceptsPublicInterventions: true }, { merge: true });
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    error: "Cette société n'accepte pas encore les demandes publiques.",
  };
}
