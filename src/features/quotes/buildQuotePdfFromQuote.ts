import type { BillingPdfBranding } from "@/features/billing";
import {
  defaultBillingPdfBranding,
  generateInterventionQuotePdf,
} from "@/features/billing/generateQuotePdf";
import type { Intervention } from "@/features/interventions";
import { quoteToBillingLines } from "./convertQuoteToInvoice";
import type { Quote } from "./types";

/** Adapte un `Quote` au format attendu par le générateur PDF (basé Intervention). */
export function quoteAsInterventionForPdf(quote: Quote): Intervention {
  return {
    id: quote.id,
    title: quote.notes?.trim() || "Devis",
    clientName: quote.clientName ?? null,
    address: "",
    problem: quote.notes ?? null,
    billingLines: quoteToBillingLines(quote.lines),
    status: "new",
  } as unknown as Intervention;
}

/** Génère le PDF d'un devis directement depuis l'objet `Quote` (sans intervention). */
export function buildQuotePdfFromQuote(quote: Quote, branding?: BillingPdfBranding): Uint8Array {
  return generateInterventionQuotePdf(
    quoteAsInterventionForPdf(quote),
    branding ?? defaultBillingPdfBranding()
  );
}

export function quotePdfFileName(quote: Quote): string {
  const slug =
    quote.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(-8)
      .toUpperCase() || "DEVIS";
  return `devis-${slug}.pdf`;
}

/** Déclenche le téléchargement navigateur du PDF devis. */
export function downloadQuotePdf(quote: Quote, branding?: BillingPdfBranding): void {
  const bytes = buildQuotePdfFromQuote(quote, branding);
  const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = quotePdfFileName(quote);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
