"use client";

import { Archive, Loader2, Mail, Reply, Star, Trash2, X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
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
  loadingDetail: boolean;
  onReply: () => void;
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
  loadingDetail,
  onReply,
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
        className={`${gmailShell} items-center justify-center px-8`}
        data-testid="gmail-hub-panel-right"
        style={gmailHubFont}
      >
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/80 text-slate-400 shadow-inner">
          <Mail className="h-7 w-7" strokeWidth={1.15} />
        </span>
        <p className="text-center text-[14px] font-medium text-slate-700">
          {t("gmail.hub.pick_message")}
        </p>
        <p className="mt-2 max-w-[240px] text-center text-[12px] leading-relaxed text-slate-400">
          {t("gmail.hub.pick_message_hint")}
        </p>
      </div>
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

  return (
    <div className={gmailShell} data-testid="gmail-hub-detail" style={gmailHubFont}>
      <div className={`flex shrink-0 items-center justify-between gap-2 border-b ${gmailDivider} px-3 py-2`}>
        <div className="flex items-center gap-0.5 rounded-2xl bg-black/[0.03] p-0.5">
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
      </div>

      <div
        className={`gmail-hub-detail-header--compact shrink-0 border-b ${gmailDivider} px-4`}
      >
        <div className="flex gap-3">
          <GmailHubAvatar seed={message.from} size="sm" />
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[15px] font-medium leading-snug tracking-tight text-slate-900">
              {message.subject || `(${t("gmail.hub.no_subject")})`}
            </h3>
            <p className="mt-1 truncate text-[12px] text-slate-600">
              <span className="font-medium">{parseSenderName(message.from)}</span>
              <span className="text-slate-400"> · </span>
              <span className="text-slate-500">{parseSenderEmail(message.from)}</span>
              <span className="text-slate-400"> · </span>
              <span className="text-slate-400">{formatMailDateLong(message.date)}</span>
            </p>
          </div>
        </div>
      </div>

      {(message.attachments ?? []).length > 0 ? (
        <GmailHubAttachments
          attachments={message.attachments ?? []}
          activeAttachmentId={pdfPreviewAttachmentId}
          loadingId={pdfPreviewLoadingId}
          onOpenPdf={onOpenPdf}
        />
      ) : null}

      <div className="gmail-hub-reader-surface min-h-0 flex-1 overflow-hidden">
        {message.bodyHtml ? (
          <iframe
            data-testid="gmail-hub-body-html"
            srcDoc={wrapHtmlEmail(message.bodyHtml)}
            sandbox="allow-same-origin"
            title="Email"
            className="gmail-hub-iframe h-full w-full border-0"
          />
        ) : (
          <div className="h-full overflow-y-auto px-5 py-5 custom-scrollbar">
            <p
              data-testid="gmail-hub-body-text"
              className="whitespace-pre-wrap text-[14px] leading-[1.65] text-slate-700"
            >
              {message.bodyText}
            </p>
          </div>
        )}
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
