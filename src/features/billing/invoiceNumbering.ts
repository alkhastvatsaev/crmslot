/**
 * Numérotation séquentielle légale des factures (Belgique) :
 * une séquence continue par société et par année — `FAC-2026-00001`.
 * Le compteur vit dans `companies/{id}/counters/invoice-{year}`.
 */

export const INVOICE_NUMBER_PREFIX = "FAC";

export function invoiceCounterDocId(year: number): string {
  return `invoice-${year}`;
}

export function formatInvoiceNumber(year: number, sequence: number): string {
  const seq = Math.max(1, Math.round(sequence));
  return `${INVOICE_NUMBER_PREFIX}-${year}-${String(seq).padStart(5, "0")}`;
}

/** Valide le format `FAC-YYYY-NNNNN` (numéro déjà attribué → ne pas réallouer). */
export function isValidInvoiceNumber(value: unknown): value is string {
  return typeof value === "string" && /^FAC-\d{4}-\d{5,}$/.test(value.trim());
}
