"use client";

import { FileText, Loader2, Maximize2 } from "lucide-react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { gmailDivider, gmailEyebrow } from "@/features/gmail/gmailHubUi";
import type { GmailHubAttachment } from "@/features/gmail/gmailHubTypes";

function isPdf(att: GmailHubAttachment): boolean {
  if (att.mimeType.includes("pdf")) return true;
  return att.filename.toLowerCase().endsWith(".pdf");
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

type Props = {
  attachments: GmailHubAttachment[];
  activeAttachmentId: string | null;
  loadingId: string | null;
  onOpenPdf: (att: GmailHubAttachment) => void;
};

/** Bandeau PDF compact — l’aperçu s’ouvre en overlay plein panneau. */
export default function GmailHubAttachments({
  attachments,
  activeAttachmentId,
  loadingId,
  onOpenPdf,
}: Props) {
  const { t } = useTranslation();
  const pdfAttachments = attachments.filter(isPdf);

  if (pdfAttachments.length === 0) return null;

  return (
    <div data-testid="gmail-hub-attachments" className={`shrink-0 border-b ${gmailDivider} px-4 py-2.5`}>
      <p className={gmailEyebrow}>{t("gmail.hub.attachments_pdf")}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {pdfAttachments.map((att) => {
          const selected = activeAttachmentId === att.attachmentId;
          const loading = loadingId === att.attachmentId;
          return (
            <button
              key={att.attachmentId}
              type="button"
              data-testid={`gmail-hub-attachment-${att.attachmentId}`}
              onClick={() => onOpenPdf(att)}
              className={cn(
                "inline-flex max-w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] transition-all",
                selected
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-black/[0.04] text-slate-700 hover:bg-black/[0.07]",
              )}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" strokeWidth={1.5} />
              ) : (
                <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
              )}
              <span className="min-w-0 truncate font-medium">{att.filename}</span>
              {att.size > 0 ? (
                <span className={cn("shrink-0 tabular-nums opacity-70", selected && "text-white/80")}>
                  {formatBytes(att.size)}
                </span>
              ) : null}
              <Maximize2
                className={cn("h-3 w-3 shrink-0 opacity-50", selected && "text-white/90")}
                strokeWidth={1.5}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{t("gmail.hub.pdf_open_hint")}</p>
    </div>
  );
}
