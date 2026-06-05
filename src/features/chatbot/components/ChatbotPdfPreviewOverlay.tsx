"use client";

import { Loader2, X } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  title: string;
  loading: boolean;
  error: string | null;
  blobUrl: string | null;
  onClose: () => void;
  testIdPrefix?: string;
};

/** Overlay plein panneau — aperçu PDF + fermeture (rails gauche / droite). */
export default function ChatbotPdfPreviewOverlay({
  title,
  loading,
  error,
  blobUrl,
  onClose,
  testIdPrefix = "chatbot-documents",
}: Props) {
  const { t } = useTranslation();
  const prefix = testIdPrefix;

  return (
    <div
      className="absolute inset-0 z-10 flex min-h-0 flex-col bg-white/94 backdrop-blur-xl animate-in fade-in duration-200"
      data-testid={`${prefix}-preview-overlay`}
      role="dialog"
      aria-modal="true"
      aria-label={title || String(t("chatbot.pdf_preview_aria"))}
      style={outfit}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-black/[0.05] px-3 py-2.5">
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-[-0.02em] text-slate-700">
          {title || String(t("chatbot.pdf_document_fallback"))}
        </p>
        <button
          type="button"
          data-testid={`${prefix}-preview-close`}
          aria-label={String(t("chatbot.close_preview"))}
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-black/[0.05] hover:text-slate-800"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col" data-testid={`${prefix}-preview`}>
        {loading ? (
          <div
            className="flex min-h-0 flex-1 items-center justify-center bg-[#f8f9fb]"
            data-testid={`${prefix}-preview-loading`}
          >
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : error ? (
          <p
            className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[12px] text-slate-500"
            data-testid={`${prefix}-preview-error`}
            role="alert"
          >
            {error}
          </p>
        ) : blobUrl ? (
          <iframe
            data-testid={`${prefix}-preview-iframe`}
            title={title || String(t("chatbot.pdf_document_pdf_fallback"))}
            src={blobUrl}
            className="min-h-0 flex-1 w-full border-0 bg-[#f8f9fb]"
          />
        ) : null}
      </div>
    </div>
  );
}
