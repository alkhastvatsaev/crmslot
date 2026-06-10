import { doc, updateDoc, type Firestore } from "firebase/firestore";
import type { Quote, QuoteLine } from "./types";

type BillingLine = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  reference?: string;
};

/** Copie les lignes de devis vers le format `intervention.billingLines`. */
export function quoteToBillingLines(lines: QuoteLine[]): BillingLine[] {
  return lines.map((line) => ({
    description: line.description,
    quantity: line.quantity,
    unitPriceCents: line.unitPriceCents,
    ...(line.reference ? { reference: line.reference } : {}),
  }));
}

/**
 * Pont devis → facture : à l'acceptation d'un devis lié à une intervention,
 * copie les lignes vers `intervention.billingLines` et trace `quoteId`.
 * Le montant facture est recalculé depuis les lignes à la finalisation
 * (`finalizeInterventionInvoiceAdmin`) — pas écrit ici (règles Firestore).
 *
 * @returns true si l'intervention a été mise à jour, false si devis non lié.
 */
export async function applyQuoteToInterventionBilling(
  db: Firestore,
  quote: Quote
): Promise<boolean> {
  const interventionId = quote.interventionId?.trim();
  if (!interventionId || quote.lines.length === 0) return false;

  await updateDoc(doc(db, "interventions", interventionId), {
    billingLines: quoteToBillingLines(quote.lines),
    quoteId: quote.id,
  });
  return true;
}
