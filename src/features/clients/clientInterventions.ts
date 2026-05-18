import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import type { Intervention } from "@/features/interventions/types";

const CLIENT_INTERVENTIONS_LIMIT = 20;

export function mapInterventionDoc(id: string, data: Record<string, unknown>): Intervention {
  return { id, ...data } as Intervention;
}

export function subscribeClientInterventions(
  db: Firestore,
  companyId: string,
  clientId: string,
  onRows: (rows: Intervention[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const cid = companyId.trim();
  const clid = clientId.trim();
  if (!cid || !clid) {
    onRows([]);
    return () => {};
  }

  const q = query(
    collection(db, "interventions"),
    where("companyId", "==", cid),
    where("clientId", "==", clid),
    orderBy("createdAt", "desc"),
    limit(CLIENT_INTERVENTIONS_LIMIT),
  );

  return onSnapshot(
    q,
    (snap) => {
      onRows(snap.docs.map((d) => mapInterventionDoc(d.id, d.data() as Record<string, unknown>)));
    },
    (err) => onError?.(err),
  );
}
