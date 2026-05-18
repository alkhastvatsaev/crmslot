import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
  query, where, orderBy, serverTimestamp, type Firestore,
} from "firebase/firestore";
import type { QuickNote, NoteVisibility } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "quickNotes");

export function subscribeNotesByIntervention(
  db: Firestore,
  companyId: string,
  interventionId: string,
  onData: (notes: QuickNote[]) => void,
): () => void {
  const q = query(
    col(db, companyId),
    where("interventionId", "==", interventionId),
    orderBy("pinned", "desc"),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QuickNote, "id">) }))),
    () => onData([]),
  );
}

export async function createNote(
  db: Firestore,
  companyId: string,
  payload: {
    interventionId: string;
    authorUid: string;
    authorName?: string | null;
    content: string;
    visibility: NoteVisibility;
  },
): Promise<string> {
  const now = new Date().toISOString();
  const ref = await addDoc(col(db, companyId), {
    ...payload,
    companyId,
    pinned: false,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function togglePinNote(
  db: Firestore,
  companyId: string,
  noteId: string,
  pinned: boolean,
): Promise<void> {
  await updateDoc(doc(db, "companies", companyId, "quickNotes", noteId), {
    pinned,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteNote(
  db: Firestore,
  companyId: string,
  noteId: string,
): Promise<void> {
  await deleteDoc(doc(db, "companies", companyId, "quickNotes", noteId));
}
