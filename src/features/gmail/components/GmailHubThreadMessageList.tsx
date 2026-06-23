"use client";

import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import GmailHubAttachments from "@/features/gmail/components/GmailHubAttachments";
import GmailHubAvatar from "@/features/gmail/components/GmailHubAvatar";
import {
  formatMailDateLong,
  gmailDivider,
  parseSenderEmail,
  parseSenderName,
} from "@/features/gmail/gmailHubUi";
import { wrapHtmlEmail } from "@/features/gmail/gmailHubWrapHtmlEmail";
import type { GmailHubAttachment, GmailHubMessageDetail } from "@/features/gmail/gmailHubTypes";
import type {
  GmailLoadAttachmentFn,
  GmailPdfAttachmentPreview,
} from "@/features/gmail/useGmailPdfAttachmentPreviews";

type Props = {
  focusedMessage: GmailHubMessageDetail;
  threadMessages: GmailHubMessageDetail[];
  onFocusThreadMessage: (messageId: string) => void;
  pdfPreviewAttachmentId: string | null;
  pdfPreviewLoadingId: string | null;
  loadAttachment?: GmailLoadAttachmentFn;
  onOpenPdf: (att: GmailHubAttachment, preview?: GmailPdfAttachmentPreview | null) => void;
};

export default function GmailHubThreadMessageList({
  focusedMessage,
  threadMessages,
  onFocusThreadMessage,
  pdfPreviewAttachmentId,
  pdfPreviewLoadingId,
  loadAttachment,
  onOpenPdf,
}: Props) {
  const { t } = useTranslation();
  const thread = threadMessages.length > 1 ? threadMessages : [focusedMessage];

  return (
    <div className="gmail-hub-reader-surface min-h-0 flex-1 overflow-y-auto custom-scrollbar">
      {thread.map((tm) => {
        const focused = tm.id === focusedMessage.id;
        return (
          <article
            key={tm.id}
            data-testid={`gmail-hub-thread-msg-${tm.id}`}
            className={cn(
              "border-b border-black/[0.06]",
              focused ? "bg-white/50" : "cursor-pointer hover:bg-black/[0.02]"
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
                messageId={tm.id}
                attachments={tm.attachments ?? []}
                activeAttachmentId={pdfPreviewAttachmentId}
                loadingId={pdfPreviewLoadingId}
                loadAttachment={loadAttachment}
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
  );
}
