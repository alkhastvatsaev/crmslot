import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { InterventionEmail } from "./types";

export const INTERVENTION_EMAILS_COLLECTION = "intervention_emails";

export type InterventionEmailDoc = Omit<InterventionEmail, "createdAt"> & {
  createdAt: unknown;
};

export function subscribeInterventionEmails(
  db: Firestore,
  interventionId: string,
  onRows: (rows: InterventionEmailDoc[]) => void,
  onError?: (e: Error) => void,
): () => void {
  const trimmed = interventionId.trim();
  if (!trimmed) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, INTERVENTION_EMAILS_COLLECTION),
    where("interventionId", "==", trimmed),
    orderBy("createdAt", "asc"),
    limit(100),
  );
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => {
        const data = d.data() as Omit<InterventionEmailDoc, "id">;
        return { id: d.id, ...data } as InterventionEmailDoc;
      });
      onRows(rows);
    },
    (e) => {
      onError?.(e instanceof Error ? e : new Error(String(e)));
    },
  );
}

export async function markEmailRead(db: Firestore, emailId: string): Promise<void> {
  await updateDoc(doc(db, INTERVENTION_EMAILS_COLLECTION, emailId), {
    readAt: new Date().toISOString(),
  });
}
