import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  getE2eSeedCompanyId,
  getE2eSeedTechnicianUid,
  isE2eSeedAllowed,
} from "@/features/interventions/server/e2eSeedConfig";
import type { QuoteLine } from "@/features/quotes";

export const E2E_PORTAL_QUOTE_INTERVENTION_ID = "e2e-portal-quote";
export const E2E_PORTAL_QUOTE_DOC_ID = "e2e-quote-portal-1";

/** Token UUID fixe pour tests Playwright reproductibles. */
export const E2E_PORTAL_QUOTE_TOKEN = "e2e00000-0000-4000-8000-000000000001";

const E2E_QUOTE_LINES: QuoteLine[] = [
  { description: "Déplacement urgence", quantity: 1, unitPriceCents: 4500, reference: "DEP" },
  { description: "Ouverture porte", quantity: 1, unitPriceCents: 9500, reference: "OUV" },
];

export type E2ePortalQuoteScenario = "assigned" | "done";

export type E2eSeedPortalQuoteResult = {
  interventionId: string;
  companyId: string;
  portalToken: string;
  quoteId: string;
  scenario: E2ePortalQuoteScenario;
  reset: boolean;
};

function quoteTotal(lines: QuoteLine[]): number {
  return lines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPriceCents), 0);
}

/**
 * Seed dev : dossier + devis `sent` pour E2E portail (accept / facture / paiement mock).
 */
export async function e2eSeedPortalQuoteAdmin(
  db: admin.firestore.Firestore,
  opts?: { scenario?: E2ePortalQuoteScenario; portalToken?: string }
): Promise<E2eSeedPortalQuoteResult> {
  const scenario = opts?.scenario ?? "assigned";
  const portalToken = opts?.portalToken?.trim() || E2E_PORTAL_QUOTE_TOKEN;
  const interventionId = E2E_PORTAL_QUOTE_INTERVENTION_ID;
  const now = new Date().toISOString();
  const isDone = scenario === "done";

  const ivRef = db.collection("interventions").doc(interventionId);
  const existingIv = await ivRef.get();

  const ivBase: Record<string, unknown> = {
    title: "E2E — Devis portail",
    address: "Avenue Louise 100, 1050 Bruxelles",
    time: "14:00",
    status: isDone ? "done" : "assigned",
    location: { lat: 50.834, lng: 4.356 },
    companyId: getE2eSeedCompanyId(),
    problem: "Devis portail — seed Playwright",
    clientName: "Client Portail E2E",
    clientFirstName: "Client",
    clientLastName: "Portail",
    clientEmail: "e2e-portal-client@example.com",
    clientPhone: "0470998877",
    category: "serrurerie",
    assignedTechnicianUid: getE2eSeedTechnicianUid(),
    portalAccessToken: portalToken,
    statusUpdatedAt: now,
    paymentStatus: "unpaid",
    ...(isDone
      ? {
          completedAt: now,
          completedByUid: getE2eSeedTechnicianUid(),
          completionPhotoUrls: ["https://placehold.co/400x300/png?text=E2E"],
          completionSignatureUrl: "https://placehold.co/320x120/png?text=Sign",
        }
      : {}),
  };

  const ivResetFields: Record<string, unknown> = {
    billingLines: FieldValue.delete(),
    quoteId: FieldValue.delete(),
    invoiceAmountCents: FieldValue.delete(),
    invoiceNumber: FieldValue.delete(),
    invoicePdfUrl: FieldValue.delete(),
    invoicePdfStoragePath: FieldValue.delete(),
    invoicedAt: FieldValue.delete(),
    stripePaymentLinkUrl: FieldValue.delete(),
    stripePaymentLinkId: FieldValue.delete(),
  };

  if (existingIv.exists) {
    await ivRef.update({ ...ivBase, ...ivResetFields });
  } else {
    await ivRef.set({
      ...ivBase,
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  const totalCents = quoteTotal(E2E_QUOTE_LINES);
  const expiresAt = new Date(Date.now() + 30 * 86400_000).toISOString();
  const quoteRef = db
    .collection("companies")
    .doc(getE2eSeedCompanyId())
    .collection("quotes")
    .doc(E2E_PORTAL_QUOTE_DOC_ID);

  await quoteRef.set({
    companyId: getE2eSeedCompanyId(),
    interventionId,
    status: "sent",
    lines: E2E_QUOTE_LINES,
    totalCents,
    validityDays: 30,
    notes: "Seed E2E portail",
    clientName: "Client Portail E2E",
    clientEmail: "e2e-portal-client@example.com",
    createdAt: now,
    updatedAt: FieldValue.serverTimestamp(),
    sentAt: now,
    respondedAt: null,
    expiresAt,
    createdByUid: "e2e",
  });

  return {
    interventionId,
    companyId: getE2eSeedCompanyId(),
    portalToken,
    quoteId: E2E_PORTAL_QUOTE_DOC_ID,
    scenario,
    reset: existingIv.exists,
  };
}
