import type * as admin from "firebase-admin";
import {
  isQuoteVisibleOnPortal,
  toPortalQuoteSummary,
  type PortalQuoteSummary,
} from "@/features/quotes/portalQuoteSummary";
import type { Quote } from "@/features/quotes/types";

/** Charge les devis liés à une intervention pour affichage portail. */
export async function loadPortalQuotesAdmin(
  db: admin.firestore.Firestore,
  companyId: string,
  interventionId: string
): Promise<PortalQuoteSummary[]> {
  const cid = companyId.trim();
  const iid = interventionId.trim();
  if (!cid || !iid) return [];

  const snap = await db
    .collection("companies")
    .doc(cid)
    .collection("quotes")
    .where("interventionId", "==", iid)
    .get();

  const quotes = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<Quote, "id">) }))
    .filter(isQuoteVisibleOnPortal)
    .sort((a, b) => (b.sentAt ?? b.createdAt).localeCompare(a.sentAt ?? a.createdAt));

  return quotes.map((q) => toPortalQuoteSummary(q));
}
