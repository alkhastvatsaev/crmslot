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

/** Collection Firestore — nom historique conservé (`portal_ivana_chat_messages`). */
export const PORTAL_CHAT_COLLECTION = "portal_ivana_chat_messages";

export type PortalChatRole = "client" | "staff";

export type PortalChatDoc = {
  id: string;
  companyId: string;
  body: string;
  role: PortalChatRole;
  senderUid: string;
  /** Affichage UI — displayName/email/n° de dossier figé au moment de l'envoi. */
  senderName?: string;
  createdAt: unknown;
  /** Dossier lié (portail / timeline) — optionnel pour messages historiques. */
  interventionId?: string | null;
  imageUrls?: string[];
};

export function subscribePortalChatMessages(
  db: Firestore,
  companyId: string,
  onRows: (rows: PortalChatDoc[]) => void,
  onError?: (e: Error) => void
): () => void {
  const trimmed = companyId.trim();
  if (!trimmed) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, PORTAL_CHAT_COLLECTION),
    where("companyId", "==", trimmed),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  let unsub: (() => void) | undefined;
  const timeout = setTimeout(() => {
    unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() as Omit<PortalChatDoc, "id">;
          return { id: d.id, ...data } as PortalChatDoc;
        });
        onRows(rows);
      },
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
  onRows: (rows: PortalChatDoc[]) => void,
  onError?: (e: Error) => void
): () => void {
  const ivId = interventionId.trim();
  if (!ivId) {
    onRows([]);
    return () => {};
  }
  const q = query(
    collection(db, PORTAL_CHAT_COLLECTION),
    where("interventionId", "==", ivId),
    orderBy("createdAt", "asc"),
    limit(200)
  );
  let unsub: (() => void) | undefined;
  const timeout = setTimeout(() => {
    unsub = onSnapshot(
      q,
      (snap) => {
        onRows(
          snap.docs.map((d) => {
            const data = d.data() as Omit<PortalChatDoc, "id">;
            return { id: d.id, ...data };
          })
        );
      },
      (e) => onError?.(e instanceof Error ? e : new Error(String(e)))
    );
  }, 10);
  return () => {
    clearTimeout(timeout);
    unsub?.();
  };
}

export async function sendPortalChatMessage(
  db: Firestore,
  params: {
    companyId: string;
    body: string;
    role: PortalChatRole;
    senderUid: string;
    senderName?: string | null;
    interventionId?: string | null;
    imageUrls?: string[];
  }
): Promise<string> {
  const ivId = params.interventionId?.trim();
  const senderName = params.senderName?.trim();
  const ref = await addDoc(collection(db, PORTAL_CHAT_COLLECTION), {
    companyId: params.companyId.trim(),
    body: params.body,
    role: params.role,
    senderUid: params.senderUid,
    createdAt: serverTimestamp(),
    ...(senderName ? { senderName } : {}),
    ...(ivId ? { interventionId: ivId } : {}),
    ...(params.imageUrls && params.imageUrls.length > 0 ? { imageUrls: params.imageUrls } : {}),
  });
  return ref.id;
}
