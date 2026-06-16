import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  getE2eSeedCompanyId,
  getE2eSeedTechnicianUid,
  isE2eSeedAllowed,
} from "@/features/interventions/server/e2eSeedConfig";

export const E2E_DONE_INTERVENTION_ID = "e2e-invoice-validation";

export type E2eSeedDoneInterventionResult = {
  interventionId: string;
  companyId: string;
  reset: boolean;
};

/**
 * Crée ou réinitialise un dossier `done` pour les tests E2E facturation (dev uniquement).
 */
export async function e2eSeedDoneInterventionAdmin(
  db: admin.firestore.Firestore,
  opts?: { interventionId?: string }
): Promise<E2eSeedDoneInterventionResult> {
  const interventionId = (opts?.interventionId?.trim() || E2E_DONE_INTERVENTION_ID).slice(0, 128);
  const now = new Date().toISOString();
  const ref = db.collection("interventions").doc(interventionId);
  const existing = await ref.get();

  const payload: Record<string, unknown> = {
    title: "E2E — Porte bloquée",
    address: "Rue de la Loi 16, 1000 Bruxelles",
    time: "10:00",
    status: "done",
    location: { lat: 50.8466, lng: 4.3528 },
    companyId: getE2eSeedCompanyId(),
    problem: "Porte bloquée — seed Playwright facturation",
    clientName: "Client E2E",
    clientFirstName: "Client",
    clientLastName: "E2E",
    clientEmail: "e2e-invoice-client@example.com",
    clientPhone: "0470123456",
    category: "serrurerie",
    assignedTechnicianUid: getE2eSeedTechnicianUid(),
    completedAt: now,
    completedByUid: getE2eSeedTechnicianUid(),
    completionPhotoUrls: [
      "https://placehold.co/400x300/png?text=E2E+Photo",
      "https://placehold.co/400x300/png?text=E2E+Photo+2",
    ],
    completionSignatureUrl: "https://placehold.co/320x120/png?text=Signature",
    billingLines: [
      { description: "Déplacement urgence", quantity: 1, unitPriceCents: 4500, reference: "DEP" },
      {
        description: "Ouverture porte blindée",
        quantity: 1,
        unitPriceCents: 12_500,
        reference: "OUV",
      },
    ],
    invoiceAmountCents: 17_000,
    draftBillingSource: "template",
    draftBillingPreparedAt: now,
    paymentStatus: "unpaid",
    statusUpdatedAt: now,
    invoicePdfUrl: FieldValue.delete(),
    invoicePdfStoragePath: FieldValue.delete(),
    invoicedAt: FieldValue.delete(),
  };

  if (existing.exists) {
    await ref.update(payload);
  } else {
    const {
      invoicePdfUrl: _pdf,
      invoicePdfStoragePath: _path,
      invoicedAt: _inv,
      ...createPayload
    } = payload;
    void _pdf;
    void _path;
    void _inv;
    await ref.set({
      ...createPayload,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    interventionId,
    companyId: getE2eSeedCompanyId(),
    reset: existing.exists,
  };
}
