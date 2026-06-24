"use client";

import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import { toast } from "sonner";
import { isFirestorePermissionDenied } from "@/core/firestore/firestoreClientErrors";
import { logger } from "@/core/logger";
import { subscribePortalChatMessages } from "@/features/backoffice/portalChatFirestore";
import type { PortalChatDoc } from "@/features/backoffice/portalChatFirestore";
import { filterPortalChatMessagesForViewer } from "@/features/backoffice/portalChatThreadFilter";
import {
  companyChatWelcome,
  mapPortalChatRowsToMessages,
  mergeCompanyChatWithOptimistic,
} from "@/features/backoffice/companyChatMessageMerge";
import type { CompanyChatMessage } from "@/features/backoffice/companyChatTypes";

export function useCompanyChatFirestoreSync(
  firestoreSyncEnabled: boolean,
  chatDb: Firestore | null,
  companyIdTrimmed: string,
  chatAuth: Auth | null,
  filterThreadId: string | null,
  publishAsPortal: boolean,
  portalChatRowsRef: MutableRefObject<PortalChatDoc[]>,
  onRemoteClientMessage: (() => void) | undefined,
  t: (key: string) => string,
  setMessages: Dispatch<SetStateAction<CompanyChatMessage[]>>,
  pendingDocIdRef: MutableRefObject<Map<string, string>>
) {
  const fsHydratedRef = useRef(false);
  const seenFsIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fsHydratedRef.current = false;
    seenFsIdsRef.current.clear();
  }, [companyIdTrimmed, filterThreadId]);

  useEffect(() => {
    if (!firestoreSyncEnabled || !chatDb || !companyIdTrimmed || !chatAuth) return;

    let unsubMessages: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(chatAuth, (user) => {
      unsubMessages?.();
      unsubMessages = undefined;
      fsHydratedRef.current = false;
      seenFsIdsRef.current.clear();

      if (!user) {
        setMessages([companyChatWelcome(t)]);
        portalChatRowsRef.current = [];
        return;
      }

      unsubMessages = subscribePortalChatMessages(
        chatDb,
        companyIdTrimmed,
        (rows) => {
          portalChatRowsRef.current = rows;
          const filteredRows = filterPortalChatMessagesForViewer(rows, {
            threadId: filterThreadId,
            publishAsPortal,
            viewerUid: user.uid,
          });
          const mapped = mapPortalChatRowsToMessages(filteredRows);

          if (!fsHydratedRef.current) {
            fsHydratedRef.current = true;
            rows.forEach((r) => seenFsIdsRef.current.add(r.id));
          }

          const newDocs = rows.filter((r) => !seenFsIdsRef.current.has(r.id));
          newDocs.forEach((r) => seenFsIdsRef.current.add(r.id));
          if (
            onRemoteClientMessage &&
            newDocs.some((r) => r.role === "client" && r.senderUid !== user.uid)
          ) {
            onRemoteClientMessage();
          }

          setMessages((prev) =>
            mergeCompanyChatWithOptimistic({
              mapped,
              filteredRows,
              prev,
              pendingDocIdRef: pendingDocIdRef.current,
              welcome: companyChatWelcome(t),
            })
          );
        },
        (err) => {
          logger.error("[CompanyChatPanel] Firestore chat", {
            error: err instanceof Error ? err.message : String(err),
          });
          const description = isFirestorePermissionDenied(err)
            ? t("chat.profile_permission_denied")
            : err instanceof Error
              ? err.message
              : t("chat.toast_send_failed");
          toast.error("Chat", { description: String(description) });
        }
      );
    });

    return () => {
      unsubAuth();
      unsubMessages?.();
    };
  }, [
    firestoreSyncEnabled,
    companyIdTrimmed,
    chatDb,
    chatAuth,
    filterThreadId,
    publishAsPortal,
    portalChatRowsRef,
    onRemoteClientMessage,
    t,
    setMessages,
    pendingDocIdRef,
  ]);
}
