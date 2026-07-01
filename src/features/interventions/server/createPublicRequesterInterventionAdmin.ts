import type * as admin from "firebase-admin";
import { ensureCompanyAcceptsPublicInterventionsAdmin } from "@/features/backoffice/server/ensureCompanyAcceptsPublicInterventionsAdmin";

const BLOCKED_PAYLOAD_KEYS = new Set([
  "paymentStatus",
  "stripePaymentLinkUrl",
  "stripePaymentIntentId",
  "mockPayToken",
  "paidAt",
  "invoiceNumber",
  "commissionAmountCents",
  "commissionRuleId",
  "invoicePdfUrl",
  "invoicedAt",
]);

export type CreatePublicRequesterInterventionInput = {
  db: admin.firestore.Firestore;
  uid: string;
  companyId: string;
  interventionId: string;
  payload: Record<string, unknown>;
};

export type CreatePublicRequesterInterventionResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string };

function validatePublicRequesterPayload(
  uid: string,
  companyId: string,
  payload: Record<string, unknown>
): string | null {
  if (payload.createdByUid !== uid) {
    return "createdByUid invalide.";
  }
  if (payload.companyId !== companyId) {
    return "companyId invalide.";
  }
  if (payload.status !== "pending") {
    return "Statut invalide.";
  }
  if (
    payload.assignedTechnicianUid != null &&
    payload.assignedTechnicianUid !== "" &&
    payload.assignedTechnicianUid !== uid
  ) {
    return "Assignation technicien non autorisée.";
  }
  for (const key of Object.keys(payload)) {
    if (BLOCKED_PAYLOAD_KEYS.has(key)) {
      return `Champ interdit : ${key}`;
    }
  }
  return null;
}

/** Création intervention portail particulier (Admin SDK — contourne permission-denied client). */
export async function createPublicRequesterInterventionAdmin(
  input: CreatePublicRequesterInterventionInput
): Promise<CreatePublicRequesterInterventionResult> {
  const { db, uid, companyId, interventionId, payload } = input;
  const trimmedId = interventionId.trim();
  const trimmedCompany = companyId.trim();

  if (!trimmedId || !trimmedCompany) {
    return { ok: false, status: 400, error: "Paramètres invalides." };
  }

  const gate = await ensureCompanyAcceptsPublicInterventionsAdmin(db, trimmedCompany);
  if (!gate.ok) {
    return { ok: false, status: gate.status, error: gate.error };
  }

  const validationError = validatePublicRequesterPayload(uid, trimmedCompany, payload);
  if (validationError) {
    return { ok: false, status: 400, error: validationError };
  }

  const ref = db.collection("interventions").doc(trimmedId);
  const existing = await ref.get();
  if (existing.exists) {
    return { ok: false, status: 409, error: "Demande déjà enregistrée." };
  }

  await ref.set({
    ...payload,
    companyId: trimmedCompany,
    createdByUid: uid,
    status: "pending",
    assignedTechnicianUid: payload.assignedTechnicianUid ?? null,
  });

  return { ok: true, id: trimmedId };
}
