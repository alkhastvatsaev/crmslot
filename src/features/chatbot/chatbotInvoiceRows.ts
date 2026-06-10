import type { Intervention } from "@/features/interventions/types";
import { MATERIAL_ORDER_CLIENT_FALLBACK } from "@/features/materials/materialOrderClientName";

export type ChatbotInvoiceRow = {
  interventionId: string;
  clientLabel: string;
  status: string;
  totalCents: number;
  invoicedAt: string | null;
  problem: string | null;
};

/** Nom client facture / liste documents — sans repli sur le titre du dossier. */
export function invoiceClientOnlyLabel(
  iv: Pick<Intervention, "clientFirstName" | "clientLastName" | "clientName">
): string {
  const first = iv.clientFirstName?.trim();
  const last = iv.clientLastName?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  const name = iv.clientName?.trim();
  if (name) return name;
  return "";
}

export function isChatbotInvoiceCandidate(iv: Intervention): boolean {
  if (iv.status === "invoiced") return true;
  if (typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0) return true;
  if (Array.isArray(iv.billingLines) && iv.billingLines.length > 0) return true;
  return false;
}

function invoiceTotalCents(iv: Intervention): number {
  if (typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0) {
    return iv.invoiceAmountCents;
  }
  if (!Array.isArray(iv.billingLines)) return 0;
  return iv.billingLines.reduce(
    (sum, l) => sum + Math.round((l.quantity || 1) * (l.unitPriceCents || 0)),
    0
  );
}

export function mapInterventionToChatbotInvoiceRow(iv: Intervention): ChatbotInvoiceRow {
  return {
    interventionId: iv.id,
    clientLabel: invoiceClientOnlyLabel(iv) || MATERIAL_ORDER_CLIENT_FALLBACK,
    status: iv.status,
    totalCents: invoiceTotalCents(iv),
    invoicedAt: iv.invoicedAt ?? iv.completedAt ?? iv.createdAt ?? null,
    problem: iv.problem ?? iv.title ?? null,
  };
}

export function buildChatbotInvoiceRows(interventions: Intervention[]): ChatbotInvoiceRow[] {
  return interventions
    .filter(isChatbotInvoiceCandidate)
    .map(mapInterventionToChatbotInvoiceRow)
    .sort((a, b) => Date.parse(String(b.invoicedAt ?? 0)) - Date.parse(String(a.invoicedAt ?? 0)));
}
