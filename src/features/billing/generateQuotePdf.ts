import { buildPremiumBillingPdf } from "@/features/billing/buildBillingPdfDocument";
import type { BillingPdfBranding } from "@/features/billing/billingPdfBranding";
import { fetchBillingPdfBrandingForCompany } from "@/features/billing/billingPdfBranding";
import type { ChatbotDocumentKind } from "@/features/chatbot/chatbot-document";
import { buildInterventionReportPdf } from "@/features/interventions/buildInterventionReportPdf";
import type { Intervention } from "@/features/interventions";

export function defaultBillingPdfBranding(companyName = "Société"): BillingPdfBranding {
  return {
    companyName,
    signerName: companyName,
    placeName: "Bruxelles",
    issuedAt: new Date(),
  };
}

export function generateInterventionQuotePdf(
  iv: Intervention,
  branding?: BillingPdfBranding
): Uint8Array {
  return buildPremiumBillingPdf(
    iv,
    "quote",
    "Total TTC indicatif",
    branding ?? defaultBillingPdfBranding()
  );
}

export function generateInterventionInvoicePdf(
  iv: Intervention,
  branding?: BillingPdfBranding
): Uint8Array {
  return buildPremiumBillingPdf(
    iv,
    "invoice",
    "Total TTC",
    branding ?? defaultBillingPdfBranding()
  );
}

export function generateInterventionDocumentPdf(
  iv: Intervention,
  kind: ChatbotDocumentKind,
  branding?: BillingPdfBranding
): Uint8Array {
  if (kind === "report") return buildInterventionReportPdf(iv);
  if (kind === "invoice") return generateInterventionInvoicePdf(iv, branding);
  return generateInterventionQuotePdf(iv, branding);
}

export async function resolveBillingPdfBranding(
  companyId: string,
  companyData?: Record<string, unknown>
): Promise<BillingPdfBranding> {
  return fetchBillingPdfBrandingForCompany(companyData, companyId);
}
