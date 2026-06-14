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
import type { TimeEntry, TimeEntryType } from "./types";
import { computeDurationMinutes } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "timeEntries");

export function subscribeCompanyTimeEntries(
  db: Firestore,
  companyId: string,
  onData: (entries: TimeEntry[]) => void
): () => void {
  const q = query(col(db, companyId), orderBy("startedAt", "desc"));
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TimeEntry, "id">) })))
  );
}

export function subscribeTimeEntries(
  db: Firestore,
  companyId: string,
  technicianUid: string,
  onData: (entries: TimeEntry[]) => void
): () => void {
  const q = query(
    col(db, companyId),
    where("technicianUid", "==", technicianUid),
    orderBy("startedAt", "desc")
  );
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TimeEntry, "id">) })))
  );
}

export function subscribeTimeEntriesByIntervention(
  db: Firestore,
  companyId: string,
  interventionId: string,
  onData: (entries: TimeEntry[]) => void
): () => void {
  const q = query(
    col(db, companyId),
    where("interventionId", "==", interventionId),
    orderBy("startedAt")
  );
  return onSnapshot(q, (snap) =>
    onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TimeEntry, "id">) })))
  );
}

export async function startTimeEntry(
  db: Firestore,
  companyId: string,
  technicianUid: string,
  type: TimeEntryType,
  interventionId?: string | null
): Promise<string> {
  const ref = await addDoc(col(db, companyId), {
    companyId,
    technicianUid,
    interventionId: interventionId ?? null,
    type,
    startedAt: new Date().toISOString(),
    endedAt: null,
    durationMinutes: null,
    notes: null,
  });
  return ref.id;
}

export async function stopTimeEntry(
  db: Firestore,
  companyId: string,
  entryId: string,
  startedAt: string
): Promise<void> {
  const endedAt = new Date().toISOString();
  await updateDoc(doc(db, "companies", companyId, "timeEntries", entryId), {
    endedAt,
    durationMinutes: computeDurationMinutes(startedAt, endedAt),
    updatedAt: serverTimestamp(),
  });
}
