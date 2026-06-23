import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import {
  MANUAL_COMMISSIONS_COLLECTION,
  type ManualCommissionEntry,
} from "./commissionFirestoreTypes";

export async function createManualCommission(
  db: Firestore,
  companyId: string,
  params: Pick<
    ManualCommissionEntry,
    "technicianUid" | "amountEuros" | "reason" | "date" | "createdByUid"
  >
): Promise<string> {
  const ref = await addDoc(collection(db, MANUAL_COMMISSIONS_COLLECTION, companyId, "entries"), {
    ...params,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeManualCommissions(
  db: Firestore,
  companyId: string,
  onRows: (rows: ManualCommissionEntry[]) => void
): () => void {
  const cid = companyId.trim();
  if (!cid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, MANUAL_COMMISSIONS_COLLECTION, cid, "entries"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) =>
      onRows(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ManualCommissionEntry, "id">),
        }))
      ),
    () => onRows([])
  );
}
