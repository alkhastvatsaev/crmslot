"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { GMAIL_HUB_PAGE_SIZE } from "@/features/gmail/gmailHubConstants";
import type {
  GmailHubAttachment,
  GmailHubLabel,
  GmailHubMessageDetail,
  GmailHubMessageSummary,
  GmailHubStatus,
} from "@/features/gmail/gmailHubTypes";

type UseGmailHubOptions = {
  /** Dossier actif (INBOX, SENT, …) — recharge la liste quand il change. */
  labelId?: string;
  /** false = pas d’appels API (page carrousel hors écran). */
  enabled?: boolean;
};

function patchUnreadInList(
  list: GmailHubMessageSummary[],
  messageId: string,
  isUnread: boolean,
): GmailHubMessageSummary[] {
  return list.map((msg) =>
    msg.id === messageId
      ? {
          ...msg,
          isUnread,
          labelIds: isUnread
            ? [...msg.labelIds.filter((l) => l !== "UNREAD"), "UNREAD"]
            : msg.labelIds.filter((l) => l !== "UNREAD"),
        }
      : msg,
  );
}

export function useGmailHub(options: UseGmailHubOptions = {}) {
  const labelId = options.labelId ?? "INBOX";
  const enabled = options.enabled !== false;
  const inboxLoadedRef = useRef(false);
  const lastLabelRef = useRef<string | null>(null);

  const [status, setStatus] = useState<GmailHubStatus | null>(null);
  const [labels, setLabels] = useState<GmailHubLabel[]>([]);
  const [messages, setMessages] = useState<GmailHubMessageSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<GmailHubMessageDetail[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailHubMessageDetail | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(
    async (opts: { labelId?: string; q?: string; append?: boolean; pageToken?: string }) => {
      const append = opts.append === true;
      if (append) setLoadingMore(true);
      else setLoadingList(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("maxResults", String(GMAIL_HUB_PAGE_SIZE));
        if (opts.labelId) params.set("labelId", opts.labelId);
        if (opts.q?.trim()) params.set("q", opts.q.trim());
        if (opts.pageToken) params.set("pageToken", opts.pageToken);
        const res = await fetchWithAuth(`/api/integrations/gmail/messages?${params.toString()}`);
        const data = (await res.json()) as {
          messages?: GmailHubMessageSummary[];
          nextPageToken?: string | null;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Boîte indisponible.");
        const batch = data.messages ?? [];
        setMessages((prev) => (append ? [...prev, ...batch] : batch));
        setNextPageToken(data.nextPageToken ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur liste.");
      } finally {
        if (append) setLoadingMore(false);
        else setLoadingList(false);
      }
    },
    [],
  );

  const loadMoreMessages = useCallback(
    async (opts: { labelId?: string; q?: string }) => {
      if (!nextPageToken || loadingMore) return;
      await loadMessages({
        labelId: opts.labelId,
        q: opts.q,
        append: true,
        pageToken: nextPageToken,
      });
    },
    [nextPageToken, loadingMore, loadMessages],
  );

  const refreshStatus = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoadingStatus(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/integrations/gmail/status");
      const data = (await res.json()) as GmailHubStatus & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Statut Gmail indisponible.");
      setStatus(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur Gmail.");
      return null;
    } finally {
      if (!opts?.silent) setLoadingStatus(false);
    }
  }, []);

  const refreshLabels = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/integrations/gmail/labels");
      const data = (await res.json()) as { labels?: GmailHubLabel[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Libellés indisponibles.");
      setLabels(data.labels ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur libellés.");
    }
  }, []);

  const modifyMessage = useCallback(
    async (messageId: string, addLabelIds: string[], removeLabelIds: string[]) => {
      const res = await fetchWithAuth(
        `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/modify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addLabelIds, removeLabelIds }),
        },
      );
      const data = (await res.json()) as { ok?: boolean; labelIds?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Modification impossible.");
      return data;
    },
    [],
  );

  const applyReadState = useCallback(
    (messageId: string, isUnread: boolean, labelIdsFromApi?: string[]) => {
      setMessages((prev) => patchUnreadInList(prev, messageId, isUnread));
      setThreadMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? {
                ...m,
                isUnread,
                labelIds:
                  labelIdsFromApi ??
                  (isUnread
                    ? [...m.labelIds.filter((l) => l !== "UNREAD"), "UNREAD"]
                    : m.labelIds.filter((l) => l !== "UNREAD")),
              }
            : m,
        ),
      );
      setSelectedMessage((prev) =>
        prev?.id === messageId
          ? {
              ...prev,
              isUnread,
              labelIds:
                labelIdsFromApi ??
                (isUnread
                  ? [...prev.labelIds.filter((l) => l !== "UNREAD"), "UNREAD"]
                  : prev.labelIds.filter((l) => l !== "UNREAD")),
            }
          : prev,
      );
    },
    [],
  );

  const toggleReadState = useCallback(
    async (messageId: string, markAsUnread: boolean) => {
      const add = markAsUnread ? ["UNREAD"] : [];
      const remove = markAsUnread ? [] : ["UNREAD"];
      const data = await modifyMessage(messageId, add, remove);
      applyReadState(messageId, markAsUnread, data.labelIds);
    },
    [modifyMessage, applyReadState],
  );

  const toggleUserLabel = useCallback(
    async (messageId: string, labelIdToToggle: string, currentlyOn: boolean) => {
      const add = currentlyOn ? [] : [labelIdToToggle];
      const remove = currentlyOn ? [labelIdToToggle] : [];
      const data = await modifyMessage(messageId, add, remove);
      const ids = data.labelIds ?? [];
      const patchSummary = (m: GmailHubMessageSummary) =>
        m.id === messageId ? { ...m, labelIds: ids } : m;
      const patchDetail = (m: GmailHubMessageDetail) =>
        m.id === messageId ? { ...m, labelIds: ids } : m;
      setMessages((prev) => prev.map(patchSummary));
      setThreadMessages((prev) => prev.map(patchDetail));
      setSelectedMessage((prev) => (prev?.id === messageId ? { ...prev, labelIds: ids } : prev));
    },
    [modifyMessage],
  );

  const loadThread = useCallback(
    async (threadId: string, focusMessageId: string) => {
      if (!threadId) return;
      setLoadingDetail(true);
      setError(null);
      try {
        const res = await fetchWithAuth(
          `/api/integrations/gmail/threads/${encodeURIComponent(threadId)}`,
        );
        const data = (await res.json()) as {
          messages?: GmailHubMessageDetail[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Conversation indisponible.");
        const list = data.messages ?? [];
        setThreadMessages(list);
        const focus = list.find((m) => m.id === focusMessageId) ?? list[list.length - 1] ?? null;
        setSelectedMessage(focus);
        if (focus && focus.isUnread) {
          await modifyMessage(focus.id, [], ["UNREAD"]);
          applyReadState(focus.id, false);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur conversation.");
        setThreadMessages([]);
        setSelectedMessage(null);
      } finally {
        setLoadingDetail(false);
      }
    },
    [modifyMessage, applyReadState],
  );

  const focusThreadMessage = useCallback((messageId: string) => {
    const m = threadMessages.find((x) => x.id === messageId);
    if (m) setSelectedMessage(m);
  }, [threadMessages]);

  const sendMessage = useCallback(
    async (input: {
      to: string;
      subject: string;
      bodyText: string;
      threadId?: string;
      inReplyTo?: string;
      references?: string;
    }) => {
      const res = await fetchWithAuth("/api/integrations/gmail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Envoi impossible.");
      return data;
    },
    [],
  );

  const loadAttachment = useCallback(
    async (messageId: string, attachment: GmailHubAttachment) => {
      const params = new URLSearchParams({
        filename: attachment.filename,
        mimeType: attachment.mimeType,
      });
      const res = await fetchWithAuth(
        `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachment.attachmentId)}?${params.toString()}`,
      );
      const data = (await res.json()) as {
        dataBase64?: string;
        mimeType?: string;
        filename?: string;
        error?: string;
      };
      if (!res.ok || !data.dataBase64) {
        throw new Error(data.error ?? "Pièce jointe indisponible.");
      }
      return {
        dataBase64: data.dataBase64,
        mimeType: data.mimeType ?? attachment.mimeType,
        filename: data.filename ?? attachment.filename,
      };
    },
    [],
  );

  const disconnectGmail = useCallback(async () => {
    const res = await fetchWithAuth("/api/integrations/gmail/disconnect", { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Déconnexion impossible.");
    setMessages([]);
    setNextPageToken(null);
    setLabels([]);
    setThreadMessages([]);
    setSelectedMessage(null);
    await refreshStatus();
  }, [refreshStatus]);

  const trashMessage = useCallback(async (messageId: string) => {
    const res = await fetchWithAuth(
      `/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/trash`,
      { method: "POST" },
    );
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Corbeille impossible.");
    return data;
  }, []);

  const clearThread = useCallback(() => {
    setThreadMessages([]);
    setSelectedMessage(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refreshStatus();
  }, [refreshStatus, enabled]);

  useEffect(() => {
    if (!enabled) {
      inboxLoadedRef.current = false;
      lastLabelRef.current = null;
      return;
    }
    if (!status?.oauthConfigured) {
      inboxLoadedRef.current = false;
      lastLabelRef.current = null;
      return;
    }
    const firstInboxLoad = !inboxLoadedRef.current;
    const labelChanged = lastLabelRef.current !== labelId;
    if (!firstInboxLoad && !labelChanged) return;

    lastLabelRef.current = labelId;
    inboxLoadedRef.current = true;
    setNextPageToken(null);

    const tasks: Promise<unknown>[] = [loadMessages({ labelId })];
    if (firstInboxLoad) tasks.push(refreshLabels());
    void Promise.all(tasks);
  }, [enabled, status?.oauthConfigured, labelId, loadMessages, refreshLabels]);

  return {
    status,
    labels,
    messages,
    nextPageToken,
    threadMessages,
    selectedMessage,
    setSelectedMessage,
    loadingStatus,
    loadingList,
    loadingMore,
    loadingDetail,
    error,
    setError,
    refreshStatus,
    refreshLabels,
    loadMessages,
    loadMoreMessages,
    loadThread,
    focusThreadMessage,
    toggleReadState,
    toggleUserLabel,
    sendMessage,
    modifyMessage,
    trashMessage,
    loadAttachment,
    disconnectGmail,
    setMessages,
    clearThread,
  };
}
