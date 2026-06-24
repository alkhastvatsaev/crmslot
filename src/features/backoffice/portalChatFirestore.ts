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
  type Query,
  type QuerySnapshot,
} from "firebase/firestore";
import { portalChatMessageTimeMs } from "@/features/backoffice/portalChatInboxLogic";

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

const CHAT_PAGE_SIZE = 500;

function mapPortalChatSnapshot(snap: QuerySnapshot): PortalChatDoc[] {
  return snap.docs.map((d) => {
    const data = d.data() as Omit<PortalChatDoc, "id">;
    return { id: d.id, ...data } as PortalChatDoc;
  });
}

function sortPortalChatRows(rows: PortalChatDoc[]): PortalChatDoc[] {
  return [...rows].sort((a, b) => portalChatMessageTimeMs(a) - portalChatMessageTimeMs(b));
}

function isMissingIndexError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "failed-precondition" || code === "unimplemented";
}

function listenPortalChatQuery(
  primary: Query,
  fallback: Query,
  onRows: (rows: PortalChatDoc[]) => void,
  onError?: (e: Error) => void
): () => void {
  let activeUnsub: (() => void) | undefined;

  const attach = (q: Query, allowFallback: boolean) => {
    activeUnsub?.();
    activeUnsub = onSnapshot(
      q,
      (snap) => {
        onRows(sortPortalChatRows(mapPortalChatSnapshot(snap)));
      },
      (e) => {
        const err = e instanceof Error ? e : new Error(String(e));
        if (allowFallback && isMissingIndexError(e)) {
          attach(fallback, false);
          return;
        }
        onError?.(err);
      }
    );
  };

  attach(primary, true);

  return () => {
    activeUnsub?.();
  };
}

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

  const col = collection(db, PORTAL_CHAT_COLLECTION);
  const indexed = query(
    col,
    where("companyId", "==", trimmed),
    orderBy("createdAt", "asc"),
    limit(CHAT_PAGE_SIZE)
  );
  const fallback = query(col, where("companyId", "==", trimmed), limit(CHAT_PAGE_SIZE));

  let teardown: (() => void) | undefined;
  const timeout = setTimeout(() => {
    teardown = listenPortalChatQuery(indexed, fallback, onRows, onError);
  }, 10);

  return () => {
    clearTimeout(timeout);
    teardown?.();
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

  const col = collection(db, PORTAL_CHAT_COLLECTION);
  const indexed = query(
    col,
    where("interventionId", "==", ivId),
    orderBy("createdAt", "asc"),
    limit(CHAT_PAGE_SIZE)
  );
  const fallback = query(col, where("interventionId", "==", ivId), limit(CHAT_PAGE_SIZE));

  let teardown: (() => void) | undefined;
  const timeout = setTimeout(() => {
    teardown = listenPortalChatQuery(indexed, fallback, onRows, onError);
  }, 10);

  return () => {
    clearTimeout(timeout);
    teardown?.();
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
