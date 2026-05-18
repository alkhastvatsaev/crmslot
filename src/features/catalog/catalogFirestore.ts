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
import type { CatalogProduct } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "products");

export function subscribeCatalogProducts(
  db: Firestore,
  companyId: string,
  onData: (products: CatalogProduct[]) => void
): () => void {
  const q = query(col(db, companyId), where("isActive", "==", true), orderBy("label"));
  return onSnapshot(q, (snap) => {
    onData(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogProduct, "id">) }))
    );
  }, () => onData([]));
}

export async function createCatalogProduct(
  db: Firestore,
  companyId: string,
  data: Omit<CatalogProduct, "id" | "companyId" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(col(db, companyId), {
    ...data,
    companyId,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCatalogProduct(
  db: Firestore,
  companyId: string,
  productId: string,
  patch: Partial<Omit<CatalogProduct, "id" | "companyId" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "companies", companyId, "products", productId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
