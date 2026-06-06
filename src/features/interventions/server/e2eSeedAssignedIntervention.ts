import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { DEMO_COMPANY_ID, DEMO_TECHNICIAN_UID } from "@/core/config/devUiPreview";

export const E2E_ASSIGNED_INTERVENTION_ID = "e2e-technician-finish";

export type E2eSeedAssignedInterventionResult = {
  interventionId: string;
  companyId: string;
  reset: boolean;
};

/**
 * Crée ou réinitialise un dossier `assigned` pour les tests E2E clôture technicien (dev uniquement).
 */
export async function e2eSeedAssignedInterventionAdmin(
  db: admin.firestore.Firestore,
  opts?: { interventionId?: string }
): Promise<E2eSeedAssignedInterventionResult> {
  const interventionId = (opts?.interventionId?.trim() || E2E_ASSIGNED_INTERVENTION_ID).slice(
    0,
    128
  );
  const now = new Date().toISOString();
  const ref = db.collection("interventions").doc(interventionId);
  const existing = await ref.get();

  const payload: Record<string, unknown> = {
    title: "E2E — Clôture terrain",
    address: "Rue de la Loi 16, 1000 Bruxelles",
    time: "14:00",
    status: "assigned",
    location: { lat: 50.8466, lng: 4.3528 },
    companyId: DEMO_COMPANY_ID,
    problem: "Porte bloquée — seed Playwright clôture",
    clientName: "Client E2E Clôture",
    clientFirstName: "Client",
    clientLastName: "Clôture",
    clientEmail: "e2e-finish-client@example.com",
    clientPhone: "0470123456",
    category: "serrurerie",
    assignedTechnicianUid: DEMO_TECHNICIAN_UID,
    assignedAt: now,
    statusUpdatedAt: now,
    completionPhotoUrls: FieldValue.delete(),
    completionSignatureUrl: FieldValue.delete(),
    completedAt: FieldValue.delete(),
    completedByUid: FieldValue.delete(),
  };

  if (existing.exists) {
    await ref.update(payload);
  } else {
    const {
      completionPhotoUrls: _p,
      completionSignatureUrl: _s,
      completedAt: _c,
      completedByUid: _u,
      ...createPayload
    } = payload;
    void _p;
    void _s;
    void _c;
    void _u;
    await ref.set({
      ...createPayload,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  return {
    interventionId,
    companyId: DEMO_COMPANY_ID,
    reset: existing.exists,
  };
}
