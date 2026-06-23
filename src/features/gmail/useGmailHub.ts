"use client";

import { useEffect, useRef, useState } from "react";
import { useGmailHubConnection } from "@/features/gmail/hooks/useGmailHubConnection";
import { useGmailHubDetail } from "@/features/gmail/hooks/useGmailHubDetail";
import { useGmailHubInbox } from "@/features/gmail/hooks/useGmailHubInbox";

type UseGmailHubOptions = {
  /** Dossier actif (INBOX, SENT, …) — recharge la liste quand il change. */
  labelId?: string;
  /** false = pas d’appels API (page carrousel hors écran). */
  enabled?: boolean;
};

export function useGmailHub(options: UseGmailHubOptions = {}) {
  const labelId = options.labelId ?? "INBOX";
  const enabled = options.enabled !== false;
  const inboxLoadedRef = useRef(false);
  const lastLabelRef = useRef<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const inbox = useGmailHubInbox({ setError });
  const detail = useGmailHubDetail({ setError, setMessages: inbox.setMessages });
  const connection = useGmailHubConnection({
    setError,
    onDisconnect: () => {
      inbox.resetInbox();
      detail.resetDetail();
    },
  });

  useEffect(() => {
    if (!enabled) return;
    void connection.refreshStatus();
  }, [connection.refreshStatus, enabled]);

  useEffect(() => {
    if (!enabled) {
      inboxLoadedRef.current = false;
      lastLabelRef.current = null;
      return;
    }
    if (!connection.status?.oauthConfigured) {
      inboxLoadedRef.current = false;
      lastLabelRef.current = null;
      return;
    }
    const firstInboxLoad = !inboxLoadedRef.current;
    const labelChanged = lastLabelRef.current !== labelId;
    if (!firstInboxLoad && !labelChanged) return;

    lastLabelRef.current = labelId;
    inboxLoadedRef.current = true;
    inbox.setNextPageToken(null);

    const tasks: Promise<unknown>[] = [inbox.loadMessages({ labelId })];
    if (firstInboxLoad) tasks.push(connection.refreshLabels());
    void Promise.all(tasks);
  }, [
    enabled,
    connection.status?.oauthConfigured,
    labelId,
    inbox.loadMessages,
    connection.refreshLabels,
    inbox.setNextPageToken,
  ]);

  return {
    status: connection.status,
    labels: connection.labels,
    messages: inbox.messages,
    nextPageToken: inbox.nextPageToken,
    threadMessages: detail.threadMessages,
    selectedMessage: detail.selectedMessage,
    setSelectedMessage: detail.setSelectedMessage,
    loadingStatus: connection.loadingStatus,
    loadingList: inbox.loadingList,
    loadingMore: inbox.loadingMore,
    loadingDetail: detail.loadingDetail,
    error,
    setError,
    refreshStatus: connection.refreshStatus,
    refreshLabels: connection.refreshLabels,
    loadMessages: inbox.loadMessages,
    loadMoreMessages: inbox.loadMoreMessages,
    loadThread: detail.loadThread,
    focusThreadMessage: detail.focusThreadMessage,
    toggleReadState: detail.toggleReadState,
    toggleUserLabel: detail.toggleUserLabel,
    sendMessage: detail.sendMessage,
    modifyMessage: detail.modifyMessage,
    trashMessage: detail.trashMessage,
    loadAttachment: detail.loadAttachment,
    disconnectGmail: connection.disconnectGmail,
    setMessages: inbox.setMessages,
    clearThread: detail.clearThread,
  };
}
