import {
  collection, onSnapshot, addDoc, updateDoc, doc,
  query, where, orderBy, writeBatch, type Firestore,
  getDocs,
} from "firebase/firestore";
import type { InboxNotification, InboxNotificationType } from "./types";

const col = (db: Firestore, companyId: string) =>
  collection(db, "companies", companyId, "inboxNotifications");

export function subscribeInbox(
  db: Firestore,
  companyId: string,
  recipientUid: string,
  onData: (notifications: InboxNotification[]) => void,
  limitToUnread = false,
): () => void {
  const constraints = [
    where("recipientUid", "==", recipientUid),
    orderBy("createdAt", "desc"),
  ];
  if (limitToUnread) constraints.push(where("read", "==", false));
  const q = query(col(db, companyId), ...constraints);
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InboxNotification, "id">) }))),
    () => onData([]),
  );
}

export async function createInboxNotification(
  db: Firestore,
  companyId: string,
  payload: Omit<InboxNotification, "id" | "companyId" | "read" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(col(db, companyId), {
    ...payload,
    companyId,
    read: false,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function markNotificationRead(
  db: Firestore,
  companyId: string,
  notificationId: string,
): Promise<void> {
  await updateDoc(doc(db, "companies", companyId, "inboxNotifications", notificationId), {
    read: true,
  });
}

export async function markAllRead(
  db: Firestore,
  companyId: string,
  recipientUid: string,
): Promise<void> {
  const q = query(
    col(db, companyId),
    where("recipientUid", "==", recipientUid),
    where("read", "==", false),
  );
  const snap = await getDocs(q);
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

/** Helper to create a typed notification quickly. */
export function buildNotification(
  recipientUid: string,
  type: InboxNotificationType,
  title: string,
  body: string,
  extra: Partial<Pick<InboxNotification, "actionPath" | "interventionId">> = {},
): Omit<InboxNotification, "id" | "companyId" | "read" | "createdAt"> {
  return { recipientUid, type, title, body, ...extra };
}
