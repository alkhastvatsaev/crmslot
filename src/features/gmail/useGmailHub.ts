"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
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
};

export function useGmailHub(options: UseGmailHubOptions = {}) {
  const labelId = options.labelId ?? "INBOX";
  const inboxLoadedRef = useRef(false);
  const lastLabelRef = useRef<string | null>(null);

  const [status, setStatus] = useState<GmailHubStatus | null>(null);
  const [labels, setLabels] = useState<GmailHubLabel[]>([]);
  const [messages, setMessages] = useState<GmailHubMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailHubMessageDetail | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = useCallback(async (opts: { labelId?: string; q?: string }) => {
    setLoadingList(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (opts.labelId) params.set("labelId", opts.labelId);
      if (opts.q?.trim()) params.set("q", opts.q.trim());
      const res = await fetchWithAuth(`/api/integrations/gmail/messages?${params.toString()}`);
      const data = (await res.json()) as { messages?: GmailHubMessageSummary[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Boîte indisponible.");
      setMessages(data.messages ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur liste.");
    } finally {
      setLoadingList(false);
    }
  }, []);

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

  const loadMessageDetail = useCallback(async (messageId: string) => {
    if (!messageId) return;
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/integrations/gmail/messages/${encodeURIComponent(messageId)}`);
      const data = (await res.json()) as { message?: GmailHubMessageDetail; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Message indisponible.");
      setSelectedMessage(data.message ?? null);
      if (data.message?.isUnread) {
        await fetchWithAuth(`/api/integrations/gmail/messages/${encodeURIComponent(messageId)}/modify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur message.");
      setSelectedMessage(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

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
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Modification impossible.");
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
    setLabels([]);
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

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!status?.oauthConfigured) return;
    void refreshLabels();
  }, [status?.oauthConfigured, refreshLabels]);

  useEffect(() => {
    if (!status?.oauthConfigured) {
      inboxLoadedRef.current = false;
      lastLabelRef.current = null;
      return;
    }
    if (lastLabelRef.current === labelId && inboxLoadedRef.current) return;
    lastLabelRef.current = labelId;
    inboxLoadedRef.current = true;
    void loadMessages({ labelId });
  }, [status?.oauthConfigured, labelId, loadMessages]);

  return {
    status,
    labels,
    messages,
    selectedMessage,
    setSelectedMessage,
    loadingStatus,
    loadingList,
    loadingDetail,
    error,
    setError,
    refreshStatus,
    refreshLabels,
    loadMessages,
    loadMessageDetail,
    sendMessage,
    modifyMessage,
    trashMessage,
    loadAttachment,
    disconnectGmail,
    setMessages,
  };
}
