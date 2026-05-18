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
import type { MaterialOrder, MaterialOrderPart } from "@/features/materials/types";

export const MATERIAL_ORDERS_COLLECTION = "material_orders";

export type MaterialOrderDoc = MaterialOrder & {
  companyId?: string | null;
};

export function subscribeMaterialOrders(
  db: Firestore,
  interventionId: string,
  onRows: (rows: MaterialOrderDoc[]) => void,
): () => void {
  const id = interventionId.trim();
  if (!id) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, MATERIAL_ORDERS_COLLECTION),
    where("interventionId", "==", id),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  return onSnapshot(q, (snap) => {
    onRows(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaterialOrderDoc, "id">) })),
    );
  }, () => onRows([]));
}

export async function createMaterialOrderDoc(
  db: Firestore,
  params: {
    interventionId: string;
    companyId: string | null;
    technicianUid: string;
    partsRequested: MaterialOrderPart[];
    urgency: MaterialOrder["urgency"];
  },
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(collection(db, MATERIAL_ORDERS_COLLECTION), {
    interventionId: params.interventionId.trim(),
    companyId: params.companyId,
    technicianUid: params.technicianUid.trim(),
    partsRequested: params.partsRequested,
    urgency: params.urgency,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateMaterialOrderStatus(
  db: Firestore,
  orderId: string,
  status: MaterialOrder["status"],
): Promise<void> {
  await updateDoc(doc(db, MATERIAL_ORDERS_COLLECTION, orderId), {
    status,
    updatedAt: new Date().toISOString(),
  });
}
