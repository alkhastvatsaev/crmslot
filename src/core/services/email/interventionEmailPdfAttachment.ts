import * as admin from "firebase-admin";
import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import { generateInterventionDocumentPdf } from "@/features/billing";
import { loadBillingPdfBrandingForIntervention } from "@/features/billing/loadBillingPdfBrandingForIntervention";
import type { Intervention } from "@/features/interventions";

export type InterventionEmailPdfKind = Extract<ChatbotDocumentKind, "quote" | "invoice">;

export function isInterventionEmailPdfKind(v: string): v is InterventionEmailPdfKind {
  return v === "quote" || v === "invoice";
}

export type EmailPdfAttachment = {
  filename: string;
  content: Buffer;
  contentType: "application/pdf";
};

/** Génère le PDF facture/devis côté PWA (jsPDF) pour pièce jointe email. */
export async function buildInterventionEmailPdfAttachment(
  interventionId: string,
  kind: InterventionEmailPdfKind
): Promise<EmailPdfAttachment> {
  if (!admin.apps.length) {
    throw new Error("Firebase Admin non initialisé");
  }
  const snap = await admin.firestore().doc(`interventions/${interventionId}`).get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable");
  }
  const data = snap.data()!;
  const iv = { id: snap.id, ...data } as Intervention;
  const companyId = String(data.companyId || "").trim();
  const branding = companyId
    ? await loadBillingPdfBrandingForIntervention(admin.firestore(), companyId)
    : undefined;
  const pdf = generateInterventionDocumentPdf(iv, kind, branding);
  const label = kind === "invoice" ? "facture" : "devis";
  const shortId = interventionId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return {
    filename: `${label}-${shortId || "dossier"}.pdf`,
    content: Buffer.from(pdf),
    contentType: "application/pdf",
  };
}
