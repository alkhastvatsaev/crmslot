import type { Intervention } from "@/features/interventions";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";

const INVOICE_DATE_FMT: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "long",
  year: "numeric",
};

export function invoicePreviewFromIntervention(
  iv: Pick<
    Intervention,
    | "clientFirstName"
    | "clientLastName"
    | "clientName"
    | "clientEmail"
    | "invoiceNumber"
    | "completedAt"
    | "billingLines"
    | "invoiceAmountCents"
    | "draftBillingAiNote"
    | "invoicePdfUrl"
  >
) {
  const clientName =
    `${iv.clientFirstName ?? ""} ${iv.clientLastName ?? ""}`.trim() || iv.clientName || null;
  const completedAt = coerceFirestoreLikeDate(iv.completedAt);
  const invoiceDateLabel = completedAt
    ? completedAt.toLocaleDateString("fr-BE", INVOICE_DATE_FMT)
    : null;

  return {
    clientName,
    clientEmail: iv.clientEmail ?? null,
    invoiceNumber: iv.invoiceNumber ?? null,
    invoiceDateLabel,
    billingLines: iv.billingLines,
    invoiceAmountCents: iv.invoiceAmountCents,
    aiNote: iv.draftBillingAiNote ?? null,
    invoicePdfUrl: iv.invoicePdfUrl ?? null,
  };
}
