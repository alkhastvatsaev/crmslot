import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { SupplierOrder, SupplierOrderStatus } from "./types";
import { computeOrderTotal } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "supplierOrders");

function sortSupplierOrdersNewestFirst(rows: SupplierOrder[]): SupplierOrder[] {
  return [...rows].sort((a, b) => {
    const ta = typeof a.createdAt === "object" && a.createdAt !== null && "seconds" in a.createdAt
      ? (a.createdAt as { seconds: number }).seconds * 1000
      : Date.parse(String(a.createdAt));
    const tb = typeof b.createdAt === "object" && b.createdAt !== null && "seconds" in b.createdAt
      ? (b.createdAt as { seconds: number }).seconds * 1000
      : Date.parse(String(b.createdAt));
    return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
  });
}

export function subscribeSupplierOrders(
  db: Firestore,
  companyId: string,
  onData: (orders: SupplierOrder[]) => void,
): () => void {
  return onSnapshot(
    col(db, companyId),
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SupplierOrder, "id">),
      }));
      onData(sortSupplierOrdersNewestFirst(rows));
    },
    (err) => {
      console.warn("[supplierOrders] onSnapshot error:", err);
      onData([]);
    },
  );
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
