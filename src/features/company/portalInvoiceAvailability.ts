import type { Intervention } from "@/features/interventions";

/** Facture visible côté client (back-office a saisi la facturation ou PDF finalisé). */
export function isPortalInvoiceAvailable(
  iv: Pick<Intervention, "status" | "invoicePdfUrl" | "billingLines"> | null | undefined
): boolean {
  if (!iv) return false;
  const pdf = iv.invoicePdfUrl?.trim();
  if (pdf) return true;
  if (iv.status === "invoiced") return true;
  return (iv.billingLines?.length ?? 0) > 0;
}
