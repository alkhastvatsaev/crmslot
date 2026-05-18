import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { InterventionChecklist, ChecklistItem } from "./types";

const col = (db: Firestore) => collection(db, "checklists");

export function subscribeChecklist(
  db: Firestore,
  interventionId: string,
  onData: (checklist: InterventionChecklist | null) => void,
): () => void {
  const q = query(col(db), where("interventionId", "==", interventionId));
  return onSnapshot(q, (snap) => {
    if (snap.empty) { onData(null); return; }
    const d = snap.docs[0]!;
    onData({ id: d.id, ...(d.data() as Omit<InterventionChecklist, "id">) });
  });
}

export async function createChecklist(
  db: Firestore,
  data: Omit<InterventionChecklist, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await addDoc(col(db), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateChecklistItem(
  db: Firestore,
  checklistId: string,
  items: ChecklistItem[],
): Promise<void> {
  const allChecked = items.filter((i) => i.required).every((i) => i.checked);
  await updateDoc(doc(db, "checklists", checklistId), {
    items,
    updatedAt: serverTimestamp(),
    completedAt: allChecked ? new Date().toISOString() : null,
  });
}
