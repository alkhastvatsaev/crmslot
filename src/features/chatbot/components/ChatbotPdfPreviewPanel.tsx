"use client";

import { Loader2 } from "lucide-react";
import { useChatbotContext } from "@/features/chatbot/ChatbotContext";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function ChatbotPdfPreviewPanel() {
  const { t } = useTranslation();
  const { documentPreview } = useChatbotContext();
  const { title, blobUrl, loading, error } = documentPreview;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      data-testid="chatbot-pdf-preview-panel"
    >
      {loading ? (
        <div
          className="flex h-full min-h-0 flex-1 items-center justify-center bg-slate-50"
          data-testid="chatbot-pdf-loading"
          aria-busy="true"
          aria-label={String(t("chatbot.pdf_loading_aria"))}
        >
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : error ? (
        <div
          className="flex h-full min-h-0 flex-1 items-center justify-center px-4 text-center text-[12px] text-red-800"
          data-testid="chatbot-pdf-error"
          role="alert"
        >
          {error}
        </div>
      ) : blobUrl ? (
        <iframe
          data-testid="chatbot-pdf-iframe"
          title={title || String(t("chatbot.pdf_document_fallback"))}
          src={blobUrl}
          className="h-full min-h-0 w-full flex-1 border-0 bg-white"
        />
      ) : (
        <p
          className="flex h-full min-h-0 flex-1 items-center justify-center px-4 text-center text-[12px] text-slate-500"
          data-testid="chatbot-pdf-empty"
        >
          {t("chatbot.pdf_preview_panel_empty")}
        </p>
      )}
    </div>
  );
}
