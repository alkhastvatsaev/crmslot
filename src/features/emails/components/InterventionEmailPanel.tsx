"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, Send, X, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { useTranslation } from "@/core/i18n/I18nContext";
import { firestore } from "@/core/config/firebase";
import { markEmailRead } from "@/features/emails/interventionEmailFirestore";
import { useInterventionEmails } from "@/features/emails/useInterventionEmails";
import { coerceFirestoreLikeDate } from "@/features/interventions/technicianSchedule";
import type { InterventionEmailDoc } from "@/features/emails/interventionEmailFirestore";

function formatEmailTime(createdAt: unknown): string {
  const d = coerceFirestoreLikeDate(createdAt);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-BE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EmailBubble({
  email,
  onReply,
  onMarkRead,
  replyLabel,
}: {
  email: InterventionEmailDoc;
  onReply: (email: InterventionEmailDoc) => void;
  onMarkRead: (id: string) => void;
  replyLabel: string;
}) {
  const isOutbound = email.direction === "outbound";
  const isUnread = email.direction === "inbound" && !email.readAt;

  useEffect(() => {
    if (isUnread) onMarkRead(email.id);
  }, [isUnread, email.id, onMarkRead]);

  return (
    <div className={cn("flex flex-col gap-1", isOutbound ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-[18px] px-3.5 py-3 text-[13px] leading-relaxed shadow-sm",
          isOutbound
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
        )}
      >
        <p
          className={cn(
            "mb-1 text-[10px] font-bold uppercase tracking-wide",
            isOutbound ? "text-blue-200" : "text-slate-400"
          )}
        >
          {isOutbound ? `→ ${email.to}` : `← ${email.from}`}
        </p>
        <p className="font-semibold mb-0.5">{email.subject}</p>
        <p className="whitespace-pre-wrap">{email.bodyText}</p>
      </div>
      <div
        className={cn("flex items-center gap-2 px-1", isOutbound ? "flex-row-reverse" : "flex-row")}
      >
        <span className="text-[10px] text-slate-400">{formatEmailTime(email.createdAt)}</span>
        {!isOutbound && (
          <button
            type="button"
            data-testid={`email-reply-${email.id}`}
            onClick={() => onReply(email)}
            className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-blue-600 transition-colors"
          >
            <Reply className="w-3 h-3" />
            {replyLabel}
          </button>
        )}
        {isUnread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
      </div>
    </div>
  );
}

type ComposeState = {
  to: string;
  subject: string;
  bodyText: string;
  inReplyTo?: string;
  references?: string;
};

const EMPTY_COMPOSE: ComposeState = { to: "", subject: "", bodyText: "" };

type Props = {
  interventionId: string;
  companyId: string | null;
};

export default function InterventionEmailPanel({ interventionId, companyId }: Props) {
  const { t } = useTranslation();
  const { emails, loading, unreadCount } = useInterventionEmails(interventionId);
  const [expanded, setExpanded] = useState(false);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState<ComposeState>(EMPTY_COMPOSE);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const panelExpanded = expanded || unreadCount > 0;

  useEffect(() => {
    if (panelExpanded && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [panelExpanded, emails]);

  const handleMarkRead = useCallback((id: string) => {
    if (!firestore) return;
    markEmailRead(firestore, id).catch(() => {});
  }, []);

  const openReply = useCallback((email: InterventionEmailDoc) => {
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
    setExpanded(true);
  }, []);

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
      setCompose(EMPTY_COMPOSE);
      setComposing(false);
    } catch (err) {
      toast.error(String(t("emails.toast_send_error")), {
        description: err instanceof Error ? err.message : String(t("common.try_again")),
      });
    } finally {
      setSending(false);
    }
  }, [compose, interventionId, companyId, t]);

  return (
    <div data-testid="intervention-email-panel" className="space-y-2">
      <button
        type="button"
        data-testid="email-panel-toggle"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3 border border-slate-100 hover:bg-slate-100/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">
            {t("emails.panel_title")}
          </span>
          {unreadCount > 0 && (
            <span
              data-testid="email-unread-badge"
              className="flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white"
            >
              {unreadCount}
            </span>
          )}
          {emails.length > 0 && unreadCount === 0 && (
            <span className="text-[10px] text-slate-400">{emails.length}</span>
          )}
        </div>
        {panelExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {panelExpanded && (
        <div className="rounded-[18px] border border-slate-100 bg-white overflow-hidden">
          {emails.length > 0 && (
            <div
              ref={listRef}
              data-testid="email-thread-list"
              className="max-h-64 overflow-y-auto p-4 space-y-4"
            >
              {loading && emails.length === 0 ? (
                <div className="py-4 flex justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
                </div>
              ) : (
                emails.map((email) => (
                  <EmailBubble
                    key={email.id}
                    email={email}
                    onReply={openReply}
                    onMarkRead={handleMarkRead}
                    replyLabel={String(t("emails.reply"))}
                  />
                ))
              )}
            </div>
          )}

          {emails.length === 0 && !loading && !composing && (
            <div
              data-testid="email-panel-empty"
              className="px-4 py-6 text-center text-[12px] text-slate-400"
            >
              {t("emails.empty")}
            </div>
          )}

          {composing ? (
            <div
              className="border-t border-slate-100 p-4 space-y-3"
              data-testid="email-compose-form"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  {compose.inReplyTo ? t("emails.compose_reply") : t("emails.compose_new")}
                </span>
                <button
                  type="button"
                  data-testid="email-compose-close"
                  onClick={() => {
                    setComposing(false);
                    setCompose(EMPTY_COMPOSE);
                  }}
                  className="flex items-center justify-center w-6 h-6 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="email"
                data-testid="email-compose-to"
                placeholder={String(t("emails.placeholder_to"))}
                value={compose.to}
                onChange={(e) => setCompose((s) => ({ ...s, to: e.target.value }))}
                className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400"
              />
              <input
                type="text"
                data-testid="email-compose-subject"
                placeholder={String(t("emails.placeholder_subject"))}
                value={compose.subject}
                onChange={(e) => setCompose((s) => ({ ...s, subject: e.target.value }))}
                className="w-full rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400"
              />
              <textarea
                rows={4}
                data-testid="email-compose-body"
                placeholder={String(t("emails.placeholder_body"))}
                value={compose.bodyText}
                onChange={(e) => setCompose((s) => ({ ...s, bodyText: e.target.value }))}
                className="w-full resize-none rounded-[10px] border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:border-blue-400"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  data-testid="email-compose-cancel"
                  onClick={() => {
                    setComposing(false);
                    setCompose(EMPTY_COMPOSE);
                  }}
                  className="rounded-[10px] px-3 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-100"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  data-testid="email-compose-send"
                  disabled={sending}
                  onClick={() => void handleSend()}
                  className={cn(
                    "flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[12px] font-bold text-white transition-all",
                    sending
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                  {sending ? t("emails.sending") : t("emails.send")}
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                data-testid="email-compose-open"
                onClick={() => {
                  setComposing(true);
                  setCompose(EMPTY_COMPOSE);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] py-2.5 text-[12px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t("emails.write")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
