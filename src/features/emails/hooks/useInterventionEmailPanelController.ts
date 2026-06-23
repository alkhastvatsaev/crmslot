"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import { firestore } from "@/core/config/firebase";
import {
  EMPTY_INTERVENTION_EMAIL_COMPOSE,
  type InterventionEmailComposeState,
  type InterventionEmailPanelVariant,
  type InterventionEmailPatronView,
} from "@/features/emails/interventionEmailPanelTypes";
import { markEmailRead } from "@/features/emails/interventionEmailFirestore";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";
import { useInterventionEmails } from "@/features/emails/useInterventionEmails";

type Params = {
  interventionId: string;
  companyId: string | null;
  variant?: InterventionEmailPanelVariant;
  defaultComposeTo?: string | null;
};

export function useInterventionEmailPanelController({
  interventionId,
  companyId,
  variant = "default",
  defaultComposeTo,
}: Params) {
  const { t } = useTranslation();
  const { emails, loading, unreadCount } = useInterventionEmails(interventionId);
  const isPatron = variant === "patron";
  const [expanded, setExpanded] = useState(isPatron);
  const [patronView, setPatronView] = useState<InterventionEmailPatronView>("thread");
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState<InterventionEmailComposeState>(
    EMPTY_INTERVENTION_EMAIL_COMPOSE
  );
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const panelExpanded = isPatron || expanded || unreadCount > 0;
  const lastInbound = useMemo(
    () => [...emails].reverse().find((e) => e.direction === "inbound"),
    [emails]
  );

  useEffect(() => {
    if (!isPatron) return;
    setPatronView(emails.length > 0 ? "thread" : "compose");
    setExpanded(true);
  }, [interventionId, isPatron, emails.length]);

  useEffect(() => {
    if (panelExpanded && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [panelExpanded, emails, patronView]);

  const openNewCompose = useCallback(() => {
    setCompose({
      ...EMPTY_INTERVENTION_EMAIL_COMPOSE,
      to: defaultComposeTo?.trim() ?? "",
    });
    setComposing(true);
    if (isPatron) setPatronView("compose");
    setExpanded(true);
  }, [defaultComposeTo, isPatron]);

  const closeCompose = useCallback(() => {
    setComposing(false);
    setCompose(EMPTY_INTERVENTION_EMAIL_COMPOSE);
    if (isPatron) setPatronView("thread");
  }, [isPatron]);

  const handleMarkRead = useCallback((id: string) => {
    if (!firestore) return;
    markEmailRead(firestore, id).catch(() => {});
  }, []);

  const openReply = useCallback(
    (email: InterventionEmailDoc) => {
      const fromEmail = email.from.match(/<([^>]+)>$/)?.[1] ?? email.from;
      const subject = email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`;
      const refs = email.references ? `${email.references} ${email.messageId}` : email.messageId;
      setCompose({
        to: fromEmail,
        subject,
        bodyText: "",
        inReplyTo: email.messageId,
        references: refs,
      });
      setComposing(true);
      if (isPatron) setPatronView("compose");
      setExpanded(true);
    },
    [isPatron]
  );

  const openReplyToLast = useCallback(() => {
    if (lastInbound) openReply(lastInbound);
  }, [lastInbound, openReply]);

  const handleSend = useCallback(async () => {
    if (!compose.to.trim() || !compose.subject.trim() || !compose.bodyText.trim()) {
      toast.error(String(t("emails.toast_required_title")), {
        description: String(t("emails.toast_required_body")),
      });
      return;
    }
    if (!companyId) {
      toast.error(String(t("emails.toast_missing_company")));
      return;
    }
    setSending(true);
    try {
      const res = await fetchWithAuth("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interventionId,
          companyId,
          to: compose.to.trim(),
          subject: compose.subject.trim(),
          bodyText: compose.bodyText.trim(),
          ...(compose.inReplyTo ? { inReplyTo: compose.inReplyTo } : {}),
          ...(compose.references ? { references: compose.references } : {}),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? String(t("emails.toast_send_failed")));
      }
      toast.success(String(t("emails.toast_sent")));
      setCompose(EMPTY_INTERVENTION_EMAIL_COMPOSE);
      setComposing(false);
      if (isPatron) setPatronView("thread");
    } catch (err) {
      toast.error(String(t("emails.toast_send_error")), {
        description: err instanceof Error ? err.message : String(t("common.try_again")),
      });
    } finally {
      setSending(false);
    }
  }, [compose, interventionId, companyId, t, isPatron]);

  const showThread = isPatron ? patronView === "thread" && !composing : true;
  const showCompose = isPatron ? patronView === "compose" || composing : composing;

  const showToThread = useCallback(() => {
    setPatronView("thread");
    setComposing(false);
  }, []);

  const patchCompose = useCallback((patch: Partial<InterventionEmailComposeState>) => {
    setCompose((s) => ({ ...s, ...patch }));
  }, []);

  return {
    emails,
    loading,
    unreadCount,
    isPatron,
    expanded,
    setExpanded,
    panelExpanded,
    patronView,
    composing,
    compose,
    patchCompose,
    sending,
    listRef,
    lastInbound,
    openNewCompose,
    closeCompose,
    handleMarkRead,
    openReply,
    openReplyToLast,
    handleSend,
    showThread,
    showCompose,
    showToThread,
  };
}
