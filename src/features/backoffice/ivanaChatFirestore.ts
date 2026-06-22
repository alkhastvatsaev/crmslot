import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
  type Query,
} from "firebase/firestore";
import {
  shouldUseIosFirestorePolling,
  startIosFirestorePoll,
} from "@/core/firestore/iosFirestorePolling";

export const IVANA_PORTAL_CHAT_COLLECTION = "portal_ivana_chat_messages";

export type IvanaPortalChatRole = "client" | "staff";

export type IvanaPortalChatDoc = {
  id: string;
  companyId: string;
  body: string;
  role: IvanaPortalChatRole;
  senderUid: string;
  createdAt: unknown;
  /** Dossier lié (portail / timeline) — optionnel pour messages historiques. */
  interventionId?: string | null;
  imageUrls?: string[];
};

function mapIvanaChatDocs(snap: {
  docs: Array<{ id: string; data: () => unknown }>;
}): IvanaPortalChatDoc[] {
  return snap.docs.map((d) => {
    const data = d.data() as Omit<IvanaPortalChatDoc, "id">;
    return { id: d.id, ...data } as IvanaPortalChatDoc;
  });
}

function subscribeFirestoreQueryIosPoll<T>(
  q: Query,
  onRows: (rows: T[]) => void,
  onError: ((e: Error) => void) | undefined,
  mapRows: (snap: { docs: Array<{ id: string; data: () => unknown }> }) => T[]
): () => void {
  let cancelled = false;
  const pull = async () => {
    try {
      const snap = await getDocs(q);
      if (!cancelled) onRows(mapRows(snap));
    } catch (e) {
      onError?.(e instanceof Error ? e : new Error(String(e)));
    }
  };
  const stop = startIosFirestorePoll(() => void pull(), true);
  return () => {
    cancelled = true;
    stop();
  };
}

export function subscribeIvanaPortalMessages(
  db: Firestore,
  companyId: string,
  onRows: (rows: IvanaPortalChatDoc[]) => void,
  onError?: (e: Error) => void
): () => void {
  const trimmed = companyId.trim();
  if (!trimmed) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, IVANA_PORTAL_CHAT_COLLECTION),
    where("companyId", "==", trimmed),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  if (shouldUseIosFirestorePolling()) {
    return subscribeFirestoreQueryIosPoll(q, onRows, onError, mapIvanaChatDocs);
  }

  let unsub: (() => void) | undefined;
  const timeout = setTimeout(() => {
    unsub = onSnapshot(
      q,
      (snap) => onRows(mapIvanaChatDocs(snap)),
      (e) => {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    );
  }, 10);
  return () => {
    clearTimeout(timeout);
    unsub?.();
  };
}

export function subscribePortalChatForIntervention(
  db: Firestore,
  interventionId: string,
  onRows: (rows: IvanaPortalChatDoc[]) => void,
  onError?: (e: Error) => void
): () => void {
  const ivId = interventionId.trim();
  if (!ivId) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, IVANA_PORTAL_CHAT_COLLECTION),
    where("interventionId", "==", ivId),
    orderBy("createdAt", "asc"),
    limit(200)
  );

  if (shouldUseIosFirestorePolling()) {
    return subscribeFirestoreQueryIosPoll(q, onRows, onError, mapIvanaChatDocs);
  }

  let unsub: (() => void) | undefined;
  const timeout = setTimeout(() => {
    unsub = onSnapshot(
      q,
      (snap) => onRows(mapIvanaChatDocs(snap)),
      (e) => onError?.(e instanceof Error ? e : new Error(String(e)))
    );
  }, 10);
  return () => {
    clearTimeout(timeout);
    unsub?.();
  };
}

export async function sendIvanaPortalMessage(
  db: Firestore,
  params: {
    companyId: string;
    body: string;
    role: IvanaPortalChatRole;
    senderUid: string;
    interventionId?: string | null;
    imageUrls?: string[];
  }
): Promise<void> {
  const ivId = params.interventionId?.trim();
  await addDoc(collection(db, IVANA_PORTAL_CHAT_COLLECTION), {
    companyId: params.companyId.trim(),
    body: params.body,
    role: params.role,
    senderUid: params.senderUid,
    createdAt: serverTimestamp(),
    ...(ivId ? { interventionId: ivId } : {}),
    ...(params.imageUrls && params.imageUrls.length > 0 ? { imageUrls: params.imageUrls } : {}),
  });
}
