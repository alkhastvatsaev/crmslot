import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";

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

export function subscribeIvanaPortalMessages(
  db: Firestore,
  companyId: string,
  onRows: (rows: IvanaPortalChatDoc[]) => void,
  onError?: (e: Error) => void,
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
    limit(200),
  );
  let unsub: (() => void) | undefined;
  const timeout = setTimeout(() => {
    unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() as Omit<IvanaPortalChatDoc, "id">;
          return { id: d.id, ...data } as IvanaPortalChatDoc;
        });
        onRows(rows);
      },
      (e) => {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      },
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
  onError?: (e: Error) => void,
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
    limit(200),
  );
  let unsub: (() => void) | undefined;
  const timeout = setTimeout(() => {
    unsub = onSnapshot(
      q,
      (snap) => {
        onRows(
          snap.docs.map((d) => {
            const data = d.data() as Omit<IvanaPortalChatDoc, "id">;
            return { id: d.id, ...data };
          }),
        );
      },
      (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
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
  },
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
