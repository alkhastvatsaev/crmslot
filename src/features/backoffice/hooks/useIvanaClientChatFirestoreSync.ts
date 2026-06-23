"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { toast } from "sonner";
import { logger } from "@/core/logger";
import { subscribeIvanaPortalMessages } from "@/features/backoffice/ivanaChatFirestore";
import { filterPortalChatMessagesForThread } from "@/features/backoffice/portalChatThreadFilter";
import {
  ivanaChatWelcome,
  mapIvanaPortalRowsToMessages,
  mergeIvanaChatWithOptimistic,
} from "@/features/backoffice/ivanaChatMessageMerge";
import type { IvanaChatMessage } from "@/features/backoffice/ivanaChatTypes";

export function useIvanaClientChatFirestoreSync(
  firestoreSyncEnabled: boolean,
  chatDb: Firestore | null,
  companyIdTrimmed: string,
  chatAuth: Auth | null,
  chatInterventionId: string | null,
  onRemoteClientMessage: (() => void) | undefined,
  t: (key: string) => string,
  setMessages: Dispatch<SetStateAction<IvanaChatMessage[]>>,
  pendingDocIdRef: MutableRefObject<Map<string, string>>
) {
  const fsHydratedRef = useRef(false);
  const seenFsIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fsHydratedRef.current = false;
    seenFsIdsRef.current.clear();
  }, [companyIdTrimmed]);

  useEffect(() => {
    if (!firestoreSyncEnabled || !chatDb || !companyIdTrimmed) return;

    const unsub = subscribeIvanaPortalMessages(
      chatDb,
      companyIdTrimmed,
      (rows) => {
        const filteredRows = filterPortalChatMessagesForThread(rows, chatInterventionId);
        const mapped = mapIvanaPortalRowsToMessages(filteredRows);

        if (!fsHydratedRef.current) {
          fsHydratedRef.current = true;
          rows.forEach((r) => seenFsIdsRef.current.add(r.id));
        }

        const uid = chatAuth?.currentUser?.uid;
        const newDocs = rows.filter((r) => !seenFsIdsRef.current.has(r.id));
        newDocs.forEach((r) => seenFsIdsRef.current.add(r.id));
        if (
          onRemoteClientMessage &&
          uid &&
          newDocs.some((r) => r.role === "client" && r.senderUid !== uid)
        ) {
          onRemoteClientMessage();
        }

        setMessages((prev) =>
          mergeIvanaChatWithOptimistic({
            mapped,
            filteredRows,
            prev,
            pendingDocIdRef: pendingDocIdRef.current,
            welcome: ivanaChatWelcome(t),
          })
        );
      },
      (err) => {
        logger.error("[IvanaClientChatPanel] Firestore chat", {
          error: err instanceof Error ? err.message : String(err),
        });
        toast.error("Chat", { description: err.message });
      }
    );
    return unsub;
  }, [
    firestoreSyncEnabled,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    chatInterventionId,
    onRemoteClientMessage,
    t,
    setMessages,
    pendingDocIdRef,
  ]);
}
