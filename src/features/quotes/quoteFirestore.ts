import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { Quote, QuoteStatus, QuoteLine } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "quotes");

function computeTotal(lines: QuoteLine[]): number {
  return lines.reduce((sum, l) => sum + Math.round(l.quantity * l.unitPriceCents), 0);
}

export function subscribeQuotes(
  db: Firestore,
  companyId: string,
  onData: (quotes: Quote[]) => void,
): () => void {
  const q = query(col(db, companyId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quote, "id">) })));
  });
}

export function subscribeQuotesByIntervention(
  db: Firestore,
  companyId: string,
  interventionId: string,
  onData: (quotes: Quote[]) => void,
): () => void {
  const q = query(
    col(db, companyId),
    where("interventionId", "==", interventionId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Quote, "id">) })));
  });
}

export async function createQuote(
  db: Firestore,
  companyId: string,
  data: Pick<Quote, "lines" | "validityDays" | "notes" | "clientId" | "interventionId" | "clientName" | "clientEmail" | "createdByUid">,
): Promise<string> {
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + data.validityDays * 86400_000).toISOString();
  const ref = await addDoc(col(db, companyId), {
    ...data,
    companyId,
    status: "draft" as QuoteStatus,
    totalCents: computeTotal(data.lines),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    sentAt: null,
    respondedAt: null,
    expiresAt,
  });
  void now;
  return ref.id;
}

export async function updateQuote(
  db: Firestore,
  companyId: string,
  quoteId: string,
  patch: Partial<Pick<Quote, "lines" | "notes" | "validityDays" | "clientName" | "clientEmail">>,
): Promise<void> {
  const update: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.lines) update.totalCents = computeTotal(patch.lines);
  await updateDoc(doc(db, "companies", companyId, "quotes", quoteId), update);
}

export async function updateQuoteStatus(
  db: Firestore,
  companyId: string,
  quoteId: string,
  status: QuoteStatus,
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "companies", companyId, "quotes", quoteId), {
    status,
    updatedAt: serverTimestamp(),
    ...(status === "sent" ? { sentAt: now } : {}),
    ...(status === "accepted" || status === "declined" ? { respondedAt: now } : {}),
  });
}
