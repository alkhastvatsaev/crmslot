import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "@/core/config/firebase";

export type RecurrenceInterval = "weekly" | "biweekly" | "monthly" | "quarterly";

export interface RecurringContract {
  id: string;
  companyId: string;
  clientId?: string | null;
  clientName: string;
  address: string;
  problemDescription: string;
  interval: RecurrenceInterval;
  nextDueDate: string;
  active: boolean;
  createdAt: string;
  lastGeneratedAt?: string | null;
}

export type RecurringContractInput = Omit<RecurringContract, "id" | "createdAt">;

export async function createRecurringContract(input: RecurringContractInput): Promise<string> {
  if (!firestore) throw new Error("Firestore not configured");
  const ref = await addDoc(collection(firestore, "recurringContracts"), {
    ...input,
    createdAt: new Date().toISOString(),
    lastGeneratedAt: null,
  });
  return ref.id;
}

export async function updateRecurringContract(id: string, patch: Partial<RecurringContractInput>): Promise<void> {
  if (!firestore) throw new Error("Firestore not configured");
  await updateDoc(doc(firestore, "recurringContracts", id), patch);
}

export async function deleteRecurringContract(id: string): Promise<void> {
  if (!firestore) throw new Error("Firestore not configured");
  await deleteDoc(doc(firestore, "recurringContracts", id));
}

export function subscribeRecurringContracts(
  companyId: string,
  onData: (contracts: RecurringContract[]) => void,
): Unsubscribe {
  if (!firestore) return () => {};
  const q = query(
    collection(firestore, "recurringContracts"),
    where("companyId", "==", companyId),
  );
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecurringContract));
    data.sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
    onData(data);
  }, () => onData([]));
}

export function nextDueDateAfter(current: string, interval: RecurrenceInterval): string {
  const d = new Date(current);
  switch (interval) {
    case "weekly":    d.setDate(d.getDate() + 7);   break;
    case "biweekly":  d.setDate(d.getDate() + 14);  break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
  }
  return d.toISOString().slice(0, 10);
}
