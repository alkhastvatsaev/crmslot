import type * as admin from "firebase-admin";
import { formatInvoiceNumber, invoiceCounterDocId } from "@/features/billing/invoiceNumbering";

/**
 * Alloue le prochain numéro de facture pour une société (transaction Firestore,
 * donc séquence sans trou ni doublon même en concurrence).
 */
export async function allocateInvoiceNumberAdmin(
  db: admin.firestore.Firestore,
  companyId: string,
  now: Date = new Date()
): Promise<string> {
  const year = now.getFullYear();
  const counterRef = db
    .collection("companies")
    .doc(companyId)
    .collection("counters")
    .doc(invoiceCounterDocId(year));

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists ? Number(snap.data()?.next ?? 1) : 1;
    const sequence = Number.isFinite(current) && current >= 1 ? Math.round(current) : 1;
    tx.set(counterRef, { next: sequence + 1, year, updatedAt: now.toISOString() }, { merge: true });
    return formatInvoiceNumber(year, sequence);
  });
}
