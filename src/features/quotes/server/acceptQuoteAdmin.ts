import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { issueInterventionInvoiceAdmin } from "@/features/interventions/server/issueInterventionInvoiceAdmin";
import type { Intervention } from "@/features/interventions";
import { quoteToBillingLines } from "@/features/quotes/convertQuoteToInvoice";
import { isQuoteExpired } from "@/features/quotes/quoteExpiration";
import type { Quote } from "@/features/quotes/types";

export type AcceptQuoteAdminResult = {
  appliedBilling: boolean;
  invoiceIssued: boolean;
  invoiceError?: string;
};

function quoteCanAccept(quote: Quote): boolean {
  if (isQuoteExpired(quote)) return false;
  return quote.status === "sent" || quote.status === "draft";
}

/**
 * Accepte un devis : copie les lignes sur l'intervention liée et émet la facture
 * si l'intervention est déjà clôturée (`done`).
 */
export async function acceptQuoteAdmin(params: {
  db: admin.firestore.Firestore;
  companyId: string;
  quoteId: string;
  actorUid: string;
}): Promise<AcceptQuoteAdminResult> {
  const { db, companyId, quoteId, actorUid } = params;
  const quoteRef = db.collection("companies").doc(companyId).collection("quotes").doc(quoteId);
  const quoteSnap = await quoteRef.get();
  if (!quoteSnap.exists) {
    throw new Error("Devis introuvable.");
  }

  const quote = { id: quoteSnap.id, ...quoteSnap.data() } as Quote;
  if (quote.companyId && quote.companyId !== companyId) {
    throw new Error("Devis hors société.");
  }
  if (!quoteCanAccept(quote)) {
    throw new Error("Ce devis ne peut plus être accepté.");
  }

  const now = new Date().toISOString();
  await quoteRef.update({
    status: "accepted",
    respondedAt: now,
    updatedAt: FieldValue.serverTimestamp(),
  });

  let appliedBilling = false;
  let invoiceIssued = false;
  let invoiceError: string | undefined;

  const interventionId = quote.interventionId?.trim();
  if (interventionId && quote.lines.length > 0) {
    await db
      .collection("interventions")
      .doc(interventionId)
      .update({
        billingLines: quoteToBillingLines(quote.lines),
        quoteId: quote.id,
        updatedAt: now,
      });
    appliedBilling = true;

    const ivSnap = await db.collection("interventions").doc(interventionId).get();
    if (ivSnap.exists) {
      const iv = { id: ivSnap.id, ...ivSnap.data() } as Intervention;
      if (iv.status === "done") {
        try {
          await issueInterventionInvoiceAdmin({
            db,
            interventionId,
            actorUid,
            sendEmail: true,
            billingLinesOverride: quoteToBillingLines(quote.lines),
            transitionNote: "Facture émise depuis devis accepté",
          });
          invoiceIssued = true;
        } catch (e) {
          invoiceError = e instanceof Error ? e.message : String(e);
        }
      }
    }
  }

  return { appliedBilling, invoiceIssued, invoiceError };
}
