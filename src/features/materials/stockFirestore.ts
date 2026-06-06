import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  onSnapshot,
  increment,
  type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

export interface StockItem {
  id: string;
  companyId: string;
  reference: string;
  description: string;
  quantity: number;
  alertThreshold: number;
  unit: string;
  updatedAt: string;
  /** Vignette produit (Lecot ou manuelle). */
  imageUrl?: string | null;
  /** SKU catalogue Lecot pour résoudre la photo quand `reference` est interne. */
  lecotSku?: string | null;
}

export type StockItemInput = Omit<StockItem, "id" | "updatedAt">;

export async function createStockItem(input: StockItemInput): Promise<string> {
  if (!firestore) throw new Error("Firestore not configured");
  const ref = await addDoc(collection(firestore, "stockItems"), {
    ...input,
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function adjustStockQuantity(id: string, delta: number): Promise<void> {
  if (!firestore) throw new Error("Firestore not configured");
  await updateDoc(doc(firestore, "stockItems", id), {
    quantity: increment(delta),
    updatedAt: new Date().toISOString(),
  });
}

export async function updateStockItem(
  id: string,
  patch: Partial<Omit<StockItemInput, "companyId">>
): Promise<void> {
  if (!firestore) throw new Error("Firestore not configured");
  await updateDoc(doc(firestore, "stockItems", id), {
    ...patch,
    updatedAt: new Date().toISOString(),
  });
}

export function subscribeStockItems(
  companyId: string,
  onData: (items: StockItem[]) => void
): Unsubscribe {
  if (!firestore) return () => {};
  const q = query(collection(firestore, "stockItems"), where("companyId", "==", companyId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as StockItem);
      items.sort((a, b) => a.description.localeCompare(b.description));
      onData(items);
    },
    () => onData([])
  );
}
