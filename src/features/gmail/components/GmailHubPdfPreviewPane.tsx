"use client";

import { Loader2, X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { gmailGhostBtn, gmailHubFont, gmailShell } from "@/features/gmail/gmailHubUi";

type Props = {
  pdfPreviewUrl: string | null;
  pdfPreviewError: string | null;
  pdfPreviewLoadingId: string | null;
  messageSubject?: string;
  onClosePdf: () => void;
};

export default function GmailHubPdfPreviewPane({
  pdfPreviewUrl,
  pdfPreviewError,
  pdfPreviewLoadingId,
  messageSubject,
  onClosePdf,
}: Props) {
  const { t } = useTranslation();

  return (
    <div
      className={`${gmailShell} gmail-hub-pdf-panel`}
      data-testid="gmail-hub-pdf-panel"
      style={gmailHubFont}
    >
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
            title={messageSubject || "PDF"}
            className="gmail-hub-iframe h-full w-full border-0 bg-white"
          />
        ) : null}
      </div>
    </div>
  );
}
