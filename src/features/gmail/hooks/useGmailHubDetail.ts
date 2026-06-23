"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import {
  fetchGmailHubAttachment,
  fetchGmailHubThread,
  modifyGmailHubMessage,
  sendGmailHubMessage,
  trashGmailHubMessage,
} from "@/features/gmail/gmailHubApi";
import { patchUnreadInList } from "@/features/gmail/gmailHubMessagePatches";
import type {
  GmailHubAttachment,
  GmailHubMessageDetail,
  GmailHubMessageSummary,
} from "@/features/gmail/gmailHubTypes";

type UseGmailHubDetailParams = {
  setError: (error: string | null) => void;
  setMessages: Dispatch<SetStateAction<GmailHubMessageSummary[]>>;
};

export function useGmailHubDetail({ setError, setMessages }: UseGmailHubDetailParams) {
  const [threadMessages, setThreadMessages] = useState<GmailHubMessageDetail[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailHubMessageDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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
            : m
        )
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
          : prev
      );
    },
    [setMessages]
  );

  const modifyMessage = useCallback(
    async (messageId: string, addLabelIds: string[], removeLabelIds: string[]) => {
      return modifyGmailHubMessage(messageId, addLabelIds, removeLabelIds);
    },
    []
  );

  const toggleReadState = useCallback(
    async (messageId: string, markAsUnread: boolean) => {
      const add = markAsUnread ? ["UNREAD"] : [];
      const remove = markAsUnread ? [] : ["UNREAD"];
      const data = await modifyMessage(messageId, add, remove);
      applyReadState(messageId, markAsUnread, data.labelIds);
    },
    [applyReadState, modifyMessage]
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
    [modifyMessage, setMessages]
  );

  const loadThread = useCallback(
    async (threadId: string, focusMessageId: string) => {
      if (!threadId) return;
      setLoadingDetail(true);
      setError(null);
      try {
        const list = await fetchGmailHubThread(threadId);
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
    [applyReadState, modifyMessage, setError]
  );

  const focusThreadMessage = useCallback(
    (messageId: string) => {
      const m = threadMessages.find((x) => x.id === messageId);
      if (m) setSelectedMessage(m);
    },
    [threadMessages]
  );

  const clearThread = useCallback(() => {
    setThreadMessages([]);
    setSelectedMessage(null);
  }, []);

  const resetDetail = useCallback(() => {
    clearThread();
  }, [clearThread]);

  const sendMessage = useCallback(
    async (input: {
      to: string;
      subject: string;
      bodyText: string;
      threadId?: string;
      inReplyTo?: string;
      references?: string;
    }) => sendGmailHubMessage(input),
    []
  );

  const loadAttachment = useCallback(
    async (messageId: string, attachment: GmailHubAttachment) =>
      fetchGmailHubAttachment(messageId, attachment),
    []
  );

  const trashMessage = useCallback(
    async (messageId: string) => trashGmailHubMessage(messageId),
    []
  );

  return {
    threadMessages,
    selectedMessage,
    setSelectedMessage,
    loadingDetail,
    loadThread,
    focusThreadMessage,
    clearThread,
    resetDetail,
    modifyMessage,
    toggleReadState,
    toggleUserLabel,
    sendMessage,
    loadAttachment,
    trashMessage,
  };
}
