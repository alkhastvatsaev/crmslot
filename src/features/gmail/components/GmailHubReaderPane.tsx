"use client";

import type { ReactNode } from "react";
import { Archive, Link2, Loader2, Mail, MailOpen, Reply, Star, Tag, Trash2, X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import GmailHubAttachments from "@/features/gmail/components/GmailHubAttachments";
import GmailHubAvatar from "@/features/gmail/components/GmailHubAvatar";
import {
  formatMailDateLong,
  gmailDivider,
  gmailEyebrow,
  gmailFieldClass,
  gmailGhostBtn,
  gmailHubFont,
  gmailPrimaryBtn,
  gmailShell,
  gmailToolbarBtn,
  parseSenderEmail,
  parseSenderName,
} from "@/features/gmail/gmailHubUi";
import type {
  GmailHubAttachment,
  GmailHubLabel,
  GmailHubMessageDetail,
} from "@/features/gmail/gmailHubTypes";

type ComposeState = {
  to: string;
  subject: string;
  body: string;
};

type Props = {
  composing: boolean;
  compose: ComposeState;
  onComposeChange: (patch: Partial<ComposeState>) => void;
  onCloseCompose: () => void;
  onSend: () => void;
  sending: boolean;
  message: GmailHubMessageDetail | null;
  threadMessages: GmailHubMessageDetail[];
  onFocusThreadMessage: (messageId: string) => void;
  userLabels: GmailHubLabel[];
  loadingDetail: boolean;
  onReply: () => void;
  linkPanelOpen: boolean;
  onToggleLinkPanel: () => void;
  linkPanel: ReactNode;
  onToggleRead: () => void;
  onToggleLabel: (labelId: string) => void;
  onStar: () => void;
  onArchive: () => void;
  onTrash: () => void;
  pdfPreviewUrl: string | null;
  pdfPreviewError: string | null;
  pdfPreviewAttachmentId: string | null;
  pdfPreviewLoadingId: string | null;
  onOpenPdf: (att: GmailHubAttachment) => void;
  onClosePdf: () => void;
};

export default function GmailHubReaderPane({
  composing,
  compose,
  onComposeChange,
  onCloseCompose,
  onSend,
  sending,
  message,
  threadMessages,
  onFocusThreadMessage,
  userLabels,
  loadingDetail,
  onReply,
  linkPanelOpen,
  onToggleLinkPanel,
  linkPanel,
  onToggleRead,
  onToggleLabel,
  onStar,
  onArchive,
  onTrash,
  pdfPreviewUrl,
  pdfPreviewError,
  pdfPreviewAttachmentId,
  pdfPreviewLoadingId,
  onOpenPdf,
  onClosePdf,
}: Props) {
  const { t } = useTranslation();
  const pdfPanelOpen = Boolean(pdfPreviewUrl || pdfPreviewLoadingId || pdfPreviewError);

  if (composing) {
    return (
      <div className={gmailShell} data-testid="gmail-hub-compose" style={gmailHubFont}>
        <div className={`flex shrink-0 items-center justify-between border-b ${gmailDivider} px-4 py-3`}>
          <p className={gmailEyebrow}>{t("gmail.hub.compose")}</p>
          <button
            type="button"
            onClick={onCloseCompose}
            className={gmailGhostBtn}
            aria-label={String(t("common.cancel"))}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4 custom-scrollbar">
          <label className="block">
            <span className={`mb-1 block px-0.5 ${gmailEyebrow}`}>{t("gmail.hub.to")}</span>
            <input
              data-testid="gmail-hub-compose-to"
              value={compose.to}
              onChange={(e) => onComposeChange({ to: e.target.value })}
              className={gmailFieldClass}
            />
          </label>
          <label className="block">
            <span className={`mb-1 block px-0.5 ${gmailEyebrow}`}>{t("gmail.hub.subject")}</span>
            <input
              data-testid="gmail-hub-compose-subject"
              value={compose.subject}
              onChange={(e) => onComposeChange({ subject: e.target.value })}
              className={gmailFieldClass}
            />
          </label>
          <textarea
            data-testid="gmail-hub-compose-body"
            value={compose.body}
            onChange={(e) => onComposeChange({ body: e.target.value })}
            rows={14}
            placeholder={String(t("gmail.hub.body_placeholder"))}
            className={`${gmailFieldClass} min-h-[220px] flex-1 resize-none leading-relaxed`}
          />
        </div>
        <div className={`shrink-0 border-t ${gmailDivider} px-4 py-4`}>
          <button
            type="button"
            data-testid="gmail-hub-send-btn"
            disabled={sending}
            onClick={onSend}
            className={`${gmailPrimaryBtn} w-full`}
          >
            {t("gmail.hub.send")}
          </button>
        </div>
      </div>
    );
  }

  if (!message && !pdfPanelOpen) {
    return (
      <div
        className={gmailShell}
        data-testid="gmail-hub-panel-right"
        style={gmailHubFont}
        aria-hidden
      />
    );
  }

  if (loadingDetail && !pdfPanelOpen) {
    return (
      <div
        className={`${gmailShell} items-center justify-center`}
        data-testid="gmail-hub-panel-right"
        style={gmailHubFont}
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" strokeWidth={1.5} />
      </div>
    );
  }

  if (pdfPanelOpen) {
    return (
      <div className={`${gmailShell} gmail-hub-pdf-panel`} data-testid="gmail-hub-pdf-panel" style={gmailHubFont}>
        <div className="gmail-hub-pdf-panel__close flex shrink-0 justify-end px-2 pt-2">
          <button
            type="button"
            data-testid="gmail-hub-pdf-close"
            onClick={onClosePdf}
            className={gmailGhostBtn}
            aria-label={String(t("gmail.hub.back_to_message"))}
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="gmail-hub-pdf-panel__body min-h-0 flex-1 overflow-hidden">
          {pdfPreviewLoadingId ? (
            <div className="flex h-full items-center justify-center text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin" strokeWidth={1.5} />
            </div>
          ) : pdfPreviewError ? (
            <p
              data-testid="gmail-hub-pdf-error"
              className="m-4 rounded-xl bg-red-500/[0.07] px-4 py-3 text-[13px] text-red-800"
            >
              {pdfPreviewError}
            </p>
          ) : pdfPreviewUrl ? (
            <iframe
              data-testid="gmail-hub-pdf-iframe"
              src={pdfPreviewUrl}
              title={message?.subject || "PDF"}
              className="gmail-hub-iframe h-full w-full border-0 bg-white"
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (!message) return null;

  const starred = message.labelIds.includes("STARRED");
  const thread = threadMessages.length > 1 ? threadMessages : [message];

  return (
    <div className={gmailShell} data-testid="gmail-hub-detail" style={gmailHubFont}>
      <div className={`flex shrink-0 items-center justify-between gap-2 border-b ${gmailDivider} px-3 py-2`}>
        <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-2xl bg-black/[0.03] p-0.5">
          <button
            type="button"
            data-testid="gmail-hub-reply-btn"
            onClick={onReply}
            className={gmailToolbarBtn}
            title={String(t("gmail.hub.reply"))}
          >
            <Reply className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            data-testid="gmail-hub-link-toggle-btn"
            onClick={onToggleLinkPanel}
            className={cn(
              gmailToolbarBtn,
              linkPanelOpen && "bg-white/90 text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)]",
            )}
            title={String(t("gmail.hub.link_to_case"))}
          >
            <Link2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            data-testid="gmail-hub-read-toggle-btn"
            onClick={onToggleRead}
            className={gmailToolbarBtn}
            title={
              message.isUnread
                ? String(t("gmail.hub.mark_read"))
                : String(t("gmail.hub.mark_unread"))
            }
          >
            {message.isUnread ? (
              <MailOpen className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <Mail className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            data-testid="gmail-hub-star-btn"
            onClick={onStar}
            className={gmailToolbarBtn}
            title={String(t("gmail.hub.star"))}
          >
            <Star
              className={starred ? "text-amber-600" : "text-slate-500"}
              strokeWidth={1.5}
              fill={starred ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            data-testid="gmail-hub-archive-btn"
            onClick={onArchive}
            className={gmailToolbarBtn}
            title={String(t("gmail.hub.archive"))}
          >
            <Archive className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            data-testid="gmail-hub-trash-btn"
            onClick={onTrash}
            className={`${gmailToolbarBtn} text-red-600/85 hover:text-red-700`}
            title={String(t("gmail.hub.trash"))}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        {userLabels.length > 0 ? (
          <label className="relative flex shrink-0 items-center">
            <Tag className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
            <select
              data-testid="gmail-hub-label-select"
              className="h-9 max-w-[140px] appearance-none rounded-xl border-0 bg-white/70 pl-7 pr-2 text-[11px] text-slate-700 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.08)] outline-none"
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value;
                if (id) onToggleLabel(id);
                e.target.value = "";
              }}
              aria-label={String(t("gmail.hub.apply_label"))}
            >
              <option value="">{t("gmail.hub.apply_label")}</option>
              {userLabels.map((l) => (
                <option key={l.id} value={l.id}>
                  {message.labelIds.includes(l.id) ? `✓ ${l.name}` : l.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {linkPanelOpen ? linkPanel : null}

      {threadMessages.length > 1 ? (
        <p
          className="shrink-0 border-b border-black/[0.05] px-4 py-2 text-[11px] text-slate-500"
          data-testid="gmail-hub-thread-count"
        >
          {`${threadMessages.length} ${t("gmail.hub.thread_messages_suffix")}`}
        </p>
      ) : null}

      <div className="gmail-hub-reader-surface min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {thread.map((tm) => {
          const focused = tm.id === message.id;
          return (
            <article
              key={tm.id}
              data-testid={`gmail-hub-thread-msg-${tm.id}`}
              className={cn(
                "border-b border-black/[0.06]",
                focused ? "bg-white/50" : "cursor-pointer hover:bg-black/[0.02]",
              )}
              onClick={() => {
                if (!focused) onFocusThreadMessage(tm.id);
              }}
            >
              <div className={`gmail-hub-detail-header--compact shrink-0 px-4 ${gmailDivider}`}>
                <div className="flex gap-3 py-3">
                  <GmailHubAvatar seed={tm.from} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-slate-900">
                      {tm.subject || `(${t("gmail.hub.no_subject")})`}
                    </h3>
                    <p className="mt-1 truncate text-[12px] text-slate-600">
                      <span className="font-medium">{parseSenderName(tm.from)}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-500">{parseSenderEmail(tm.from)}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="text-slate-400">{formatMailDateLong(tm.date)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {focused && (tm.attachments ?? []).length > 0 ? (
                <GmailHubAttachments
                  attachments={tm.attachments ?? []}
                  activeAttachmentId={pdfPreviewAttachmentId}
                  loadingId={pdfPreviewLoadingId}
                  onOpenPdf={onOpenPdf}
                />
              ) : null}

              {focused ? (
                tm.bodyHtml ? (
                  <iframe
                    data-testid="gmail-hub-body-html"
                    srcDoc={wrapHtmlEmail(tm.bodyHtml)}
                    sandbox="allow-same-origin"
                    title="Email"
                    className="gmail-hub-iframe min-h-[200px] w-full border-0"
                    style={{ height: "min(50vh, 480px)" }}
                  />
                ) : (
                  <div className="px-5 py-4">
                    <p
                      data-testid="gmail-hub-body-text"
                      className="whitespace-pre-wrap text-[14px] leading-[1.65] text-slate-700"
                    >
                      {tm.bodyText}
                    </p>
                  </div>
                )
              ) : (
                <p className="line-clamp-3 px-5 pb-4 text-[13px] leading-relaxed text-slate-500">
                  {tm.bodyText || tm.snippet}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function wrapHtmlEmail(html: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { margin: 0; padding: 20px 24px; font-family: 'Outfit', system-ui, sans-serif;
      font-size: 14px; line-height: 1.6; color: #334155; background: transparent; }
    img { max-width: 100%; height: auto; }
    a { color: #0f172a; }
  </style></head><body>${html}</body></html>`;
}
