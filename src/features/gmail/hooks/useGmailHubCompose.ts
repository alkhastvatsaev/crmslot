"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { parseSenderEmail } from "@/features/gmail/gmailHubUi";
import type { useGmailHub } from "@/features/gmail/useGmailHub";

type GmailHub = ReturnType<typeof useGmailHub>;

export function useGmailHubCompose(params: {
  hub: GmailHub;
  reloadInbox: () => void;
  t: (key: string) => string;
  setLinkPanelOpen: (open: boolean) => void;
  setSelectedId: (id: string | null) => void;
}) {
  const { hub, reloadInbox, t, setLinkPanelOpen, setSelectedId } = params;
  const [composing, setComposing] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  const startCompose = useCallback(() => {
    setComposing(true);
    setSelectedId(null);
    hub.setSelectedMessage(null);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  }, [hub, setSelectedId]);

  const handleReply = useCallback(() => {
    const m = hub.selectedMessage;
    if (!m) return;
    setLinkPanelOpen(false);
    setComposeTo(parseSenderEmail(m.from));
    setComposeSubject(m.subject.startsWith("Re:") ? m.subject : `Re: ${m.subject}`);
    setComposeBody(`\n\n—\n${m.bodyText}`);
    setComposing(true);
  }, [hub.selectedMessage, setLinkPanelOpen]);

  const handleSend = useCallback(async () => {
    const m = hub.selectedMessage;
    setSending(true);
    try {
      await hub.sendMessage({
        to: composeTo.trim(),
        subject: composeSubject.trim(),
        bodyText: composeBody.trim(),
        threadId: composing && m ? m.threadId : undefined,
        inReplyTo: composing && m?.messageIdHeader ? m.messageIdHeader : undefined,
        references:
          composing && m
            ? [m.referencesHeader, m.messageIdHeader].filter(Boolean).join(" ").trim() || undefined
            : undefined,
      });
      toast.success(String(t("gmail.hub.sent_ok")));
      setComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      reloadInbox();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(t("common.error")));
    } finally {
      setSending(false);
    }
  }, [hub, composing, composeTo, composeSubject, composeBody, reloadInbox, t]);

  const handleComposeChange = useCallback(
    (patch: { to?: string; subject?: string; body?: string }) => {
      if (patch.to !== undefined) setComposeTo(patch.to);
      if (patch.subject !== undefined) setComposeSubject(patch.subject);
      if (patch.body !== undefined) setComposeBody(patch.body);
    },
    []
  );

  return {
    composing,
    setComposing,
    composeTo,
    composeSubject,
    composeBody,
    sending,
    startCompose,
    handleReply,
    handleSend,
    handleComposeChange,
  };
}
