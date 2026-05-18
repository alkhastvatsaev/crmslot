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
import type { MaintenanceContract } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "maintenanceContracts");

export function subscribeMaintenanceContracts(
  db: Firestore,
  companyId: string,
  onData: (contracts: MaintenanceContract[]) => void,
): () => void {
  const q = query(col(db, companyId), where("isActive", "==", true), orderBy("nextDueDate"));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MaintenanceContract, "id">) })));
  });
}

export async function createMaintenanceContract(
  db: Firestore,
  companyId: string,
  data: Omit<MaintenanceContract, "id" | "companyId" | "createdAt" | "updatedAt">,
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

export async function updateMaintenanceContract(
  db: Firestore,
  companyId: string,
  contractId: string,
  patch: Partial<Omit<MaintenanceContract, "id" | "companyId" | "createdAt">>,
): Promise<void> {
  await updateDoc(doc(db, "companies", companyId, "maintenanceContracts", contractId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function deactivateMaintenanceContract(
  db: Firestore,
  companyId: string,
  contractId: string,
): Promise<void> {
  await updateMaintenanceContract(db, companyId, contractId, { isActive: false });
}
