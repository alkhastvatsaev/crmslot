import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  query, where, orderBy, serverTimestamp, type Firestore,
} from "firebase/firestore";
import type { ClientEquipment, EquipmentStatus } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "equipment");

export function subscribeEquipmentByClient(
  db: Firestore,
  companyId: string,
  clientId: string,
  onData: (items: ClientEquipment[]) => void,
): () => void {
  const q = query(
    col(db, companyId),
    where("clientId", "==", clientId),
    orderBy("label"),
  );
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClientEquipment, "id">) }))),
  );
}

export function subscribeEquipmentBySite(
  db: Firestore,
  companyId: string,
  siteId: string,
  onData: (items: ClientEquipment[]) => void,
): () => void {
  const q = query(
    col(db, companyId),
    where("siteId", "==", siteId),
    orderBy("label"),
  );
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ClientEquipment, "id">) }))),
  );
}

export async function createEquipment(
  db: Firestore,
  companyId: string,
  payload: Omit<ClientEquipment, "id" | "companyId" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(col(db, companyId), {
    ...payload,
    companyId,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateEquipment(
  db: Firestore,
  companyId: string,
  equipmentId: string,
  patch: Partial<Omit<ClientEquipment, "id" | "companyId" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, "companies", companyId, "equipment", equipmentId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function retireEquipment(
  db: Firestore,
  companyId: string,
  equipmentId: string,
): Promise<void> {
  await updateEquipment(db, companyId, equipmentId, { status: "retired" as EquipmentStatus });
}
