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
import type { SupplierOrder, SupplierOrderStatus } from "./types";
import { computeOrderTotal } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "supplierOrders");

export function subscribeSupplierOrders(
  db: Firestore,
  companyId: string,
  onData: (orders: SupplierOrder[]) => void,
): () => void {
  const q = query(col(db, companyId), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SupplierOrder, "id">) })));
  });
}

export async function createSupplierOrder(
  db: Firestore,
  companyId: string,
  data: Omit<SupplierOrder, "id" | "companyId" | "createdAt" | "updatedAt" | "totalCents" | "status">,
): Promise<string> {
  const ref = await addDoc(col(db, companyId), {
    ...data,
    companyId,
    status: "draft" as SupplierOrderStatus,
    totalCents: computeOrderTotal(data.lines),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    sentAt: null,
    deliveredAt: null,
  });
  return ref.id;
}

export async function updateSupplierOrderStatus(
  db: Firestore,
  companyId: string,
  orderId: string,
  status: SupplierOrderStatus,
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, "companies", companyId, "supplierOrders", orderId), {
    status,
    updatedAt: serverTimestamp(),
    ...(status === "sent" ? { sentAt: now } : {}),
    ...(status === "delivered" ? { deliveredAt: now } : {}),
  });
}
