import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { StockItem } from "./types";

const col = (db: Firestore, companyId: string, techUid: string) =>
  collection(db, "companies", companyId, "technicianStocks", techUid, "items");

export function subscribeStockItems(
  db: Firestore,
  companyId: string,
  techUid: string,
  onData: (items: StockItem[]) => void,
): () => void {
  const q = query(col(db, companyId, techUid), orderBy("label"));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<StockItem, "id">) })));
  });
}

export async function createStockItem(
  db: Firestore,
  companyId: string,
  techUid: string,
  data: Pick<StockItem, "sku" | "label" | "quantity" | "minQuantity" | "unitPriceCents">,
): Promise<string> {
  const ref = await addDoc(col(db, companyId, techUid), {
    ...data,
    companyId,
    technicianUid: techUid,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateStockQuantity(
  db: Firestore,
  companyId: string,
  techUid: string,
  itemId: string,
  quantityDelta: number,
): Promise<void> {
  const docRef = doc(db, "companies", companyId, "technicianStocks", techUid, "items", itemId);
  // We use a snapshot to read current qty, then update
  const { getDoc } = await import("firebase/firestore");
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const current = (snap.data() as StockItem).quantity;
  await updateDoc(docRef, {
    quantity: Math.max(0, current + quantityDelta),
    updatedAt: serverTimestamp(),
  });
}

export async function updateStockItem(
  db: Firestore,
  companyId: string,
  techUid: string,
  itemId: string,
  patch: Partial<Pick<StockItem, "quantity" | "minQuantity" | "label" | "unitPriceCents">>,
): Promise<void> {
  await updateDoc(
    doc(db, "companies", companyId, "technicianStocks", techUid, "items", itemId),
    { ...patch, updatedAt: serverTimestamp() },
  );
}
