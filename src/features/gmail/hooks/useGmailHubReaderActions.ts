"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { GmailHubMessageSummary } from "@/features/gmail/gmailHubTypes";
import type { useGmailHub } from "@/features/gmail/useGmailHub";

type GmailHub = ReturnType<typeof useGmailHub>;

export function useGmailHubReaderActions(params: {
  hub: GmailHub;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  reloadInbox: () => void;
  t: (key: string) => string;
  logEmail: (subject: string) => void;
  handleSelectMessage: (msg: GmailHubMessageSummary) => void;
}) {
  const { hub, selectedId, setSelectedId, reloadInbox, t, logEmail, handleSelectMessage } = params;

  const handleListToggleRead = useCallback(
    async (msg: GmailHubMessageSummary, markAsUnread: boolean) => {
      try {
        await hub.toggleReadState(msg.id, markAsUnread);
        toast.success(
          String(markAsUnread ? t("gmail.hub.marked_unread") : t("gmail.hub.marked_read"))
        );
        logEmail(`${markAsUnread ? "Non-lu" : "Lu"} : ${msg.subject ?? "(sans objet)"}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(t("common.error")));
      }
    },
    [hub, t, logEmail]
  );

  const handleReaderToggleRead = useCallback(() => {
    const m = hub.selectedMessage;
    if (!m) return;
    void handleListToggleRead(m, !m.isUnread);
  }, [hub.selectedMessage, handleListToggleRead]);

  const handleToggleLabel = useCallback(
    (labelId: string) => {
      const m = hub.selectedMessage;
      if (!m) return;
      void (async () => {
        try {
          await hub.toggleUserLabel(m.id, labelId, m.labelIds.includes(labelId));
          toast.success(String(t("gmail.hub.label_updated")));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : String(t("common.error")));
        }
      })();
    },
    [hub, t]
  );

  const goAdjacentMessage = useCallback(
    (delta: number) => {
      if (!selectedId || hub.messages.length === 0) return;
      const idx = hub.messages.findIndex((m) => m.id === selectedId);
      if (idx < 0) return;
      const next = hub.messages[idx + delta];
      if (next) handleSelectMessage(next);
    },
    [selectedId, hub.messages, handleSelectMessage]
  );

  const handleStar = useCallback(async () => {
    const m = hub.selectedMessage;
    if (!m) return;
    const starred = m.labelIds.includes("STARRED");
    const add = starred ? [] : ["STARRED"];
    const remove = starred ? ["STARRED"] : [];
    hub.setMessages((prev) =>
      prev.map((msg) =>
        msg.id !== m.id
          ? msg
          : {
              ...msg,
              labelIds: [...msg.labelIds.filter((l) => !remove.includes(l)), ...add],
            }
      )
    );
    try {
      await hub.modifyMessage(m.id, add, remove);
      toast.success(String(t("gmail.hub.star_updated")));
      void hub.loadThread(m.threadId, m.id);
    } catch (e) {
      reloadInbox();
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  }, [hub, reloadInbox, t]);

  const handleArchive = useCallback(async () => {
    const m = hub.selectedMessage;
    if (!m) return;
    hub.setMessages((prev) => prev.filter((msg) => msg.id !== m.id));
    hub.setSelectedMessage(null);
    setSelectedId(null);
    try {
      await hub.modifyMessage(m.id, [], ["INBOX"]);
      toast.success(String(t("gmail.hub.archived")));
    } catch (e) {
      reloadInbox();
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  }, [hub, reloadInbox, setSelectedId, t]);

  const handleTrash = useCallback(async () => {
    const m = hub.selectedMessage;
    if (!m) return;
    if (!window.confirm(String(t("gmail.hub.trash_confirm")))) return;
    hub.setMessages((prev) => prev.filter((msg) => msg.id !== m.id));
    hub.setSelectedMessage(null);
    setSelectedId(null);
    try {
      await hub.trashMessage(m.id);
      toast.success(String(t("gmail.hub.trashed")));
    } catch (e) {
      reloadInbox();
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    }
  }, [hub, reloadInbox, setSelectedId, t]);

  return {
    handleListToggleRead,
    handleReaderToggleRead,
    handleToggleLabel,
    goAdjacentMessage,
    handleStar,
    handleArchive,
    handleTrash,
  };
}
