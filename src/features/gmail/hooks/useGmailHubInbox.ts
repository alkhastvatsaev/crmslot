"use client";

import { useCallback, useState } from "react";
import { fetchGmailHubMessages } from "@/features/gmail/gmailHubApi";
import type { GmailHubMessageSummary } from "@/features/gmail/gmailHubTypes";

type UseGmailHubInboxParams = {
  setError: (error: string | null) => void;
};

export function useGmailHubInbox({ setError }: UseGmailHubInboxParams) {
  const [messages, setMessages] = useState<GmailHubMessageSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMessages = useCallback(
    async (opts: { labelId?: string; q?: string; append?: boolean; pageToken?: string }) => {
      const append = opts.append === true;
      if (append) setLoadingMore(true);
      else setLoadingList(true);
      setError(null);
      try {
        const data = await fetchGmailHubMessages({
          labelId: opts.labelId,
          q: opts.q,
          pageToken: opts.pageToken,
        });
        setMessages((prev) => (append ? [...prev, ...data.messages] : data.messages));
        setNextPageToken(data.nextPageToken);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur liste.");
      } finally {
        if (append) setLoadingMore(false);
        else setLoadingList(false);
      }
    },
    [setError]
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
    [nextPageToken, loadingMore, loadMessages]
  );

  const resetInbox = useCallback(() => {
    setMessages([]);
    setNextPageToken(null);
  }, []);

  return {
    messages,
    setMessages,
    nextPageToken,
    setNextPageToken,
    loadingList,
    loadingMore,
    loadMessages,
    loadMoreMessages,
    resetInbox,
  };
}
