import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { isQuoteExpired } from "@/features/quotes/quoteExpiration";
import type { Quote } from "@/features/quotes/types";

function quoteCanDecline(quote: Quote): boolean {
  if (isQuoteExpired(quote)) return false;
  return quote.status === "sent";
}

export async function declineQuoteAdmin(params: {
  db: admin.firestore.Firestore;
  companyId: string;
  quoteId: string;
}): Promise<void> {
  const { db, companyId, quoteId } = params;
  const quoteRef = db.collection("companies").doc(companyId).collection("quotes").doc(quoteId);
  const quoteSnap = await quoteRef.get();
  if (!quoteSnap.exists) {
    throw new Error("Devis introuvable.");
  }

  const quote = { id: quoteSnap.id, ...quoteSnap.data() } as Quote;
  if (quote.companyId && quote.companyId !== companyId) {
    throw new Error("Devis hors société.");
  }
  if (!quoteCanDecline(quote)) {
    throw new Error("Ce devis ne peut plus être refusé.");
  }

  const now = new Date().toISOString();
  await quoteRef.update({
    status: "declined",
    respondedAt: now,
    updatedAt: FieldValue.serverTimestamp(),
  });
}
