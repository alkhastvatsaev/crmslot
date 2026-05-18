import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import type { ClientRecord, SiteRecord } from "./types";

export const CLIENTS_COLLECTION = "clients";
export const SITES_COLLECTION = "sites";

export function subscribeClients(
  db: Firestore,
  companyId: string,
  onRows: (rows: ClientRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const q = query(
    collection(db, CLIENTS_COLLECTION),
    where("companyId", "==", companyId),
    orderBy("displayName"),
  );
  return onSnapshot(
    q,
    (snap) => {
      onRows(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            companyId: String(data.companyId ?? companyId),
            displayName: String(data.displayName ?? ""),
            firstName: (data.firstName as string | null) ?? null,
            lastName: (data.lastName as string | null) ?? null,
            companyName: (data.companyName as string | null) ?? null,
            phone: (data.phone as string | null) ?? null,
            email: (data.email as string | null) ?? null,
            createdAt: (data.createdAt as string | null) ?? null,
            updatedAt: (data.updatedAt as string | null) ?? null,
          };
        }),
      );
    },
    (err) => onError?.(err),
  );
}

export async function createClient(
  db: Firestore,
  input: Omit<ClientRecord, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, CLIENTS_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateClient(
  db: Firestore,
  clientId: string,
  patch: Partial<Pick<ClientRecord, "displayName" | "phone" | "email" | "firstName" | "lastName" | "companyName">>,
): Promise<void> {
  await updateDoc(doc(db, CLIENTS_COLLECTION, clientId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

export async function createSite(
  db: Firestore,
  input: Omit<SiteRecord, "id" | "createdAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, SITES_COLLECTION), {
    ...input,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeClientSites(
  db: Firestore,
  companyId: string,
  clientId: string,
  onRows: (rows: SiteRecord[]) => void,
  onError?: (err: Error) => void,
): () => void {
  const cid = companyId.trim();
  const clid = clientId.trim();
  if (!cid || !clid) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, SITES_COLLECTION),
    where("companyId", "==", cid),
    where("clientId", "==", clid),
    orderBy("label"),
  );
  return onSnapshot(
    q,
    (snap) => {
      onRows(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            companyId: cid,
            clientId: clid,
            label: String(data.label ?? ""),
            address: String(data.address ?? ""),
            lat: typeof data.lat === "number" ? data.lat : null,
            lng: typeof data.lng === "number" ? data.lng : null,
            createdAt: (data.createdAt as string | null) ?? null,
          };
        }),
      );
    },
    (err) => onError?.(err),
  );
}
