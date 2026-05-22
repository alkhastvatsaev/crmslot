"use client";

import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { gmailDivider } from "@/features/gmail/gmailHubUi";
import type { GmailHubAttachment } from "@/features/gmail/gmailHubTypes";
import {
  useGmailPdfAttachmentPreviews,
  type GmailLoadAttachmentFn,
  type GmailPdfAttachmentPreview,
} from "@/features/gmail/useGmailPdfAttachmentPreviews";

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
  messageId: string | undefined;
  attachments: GmailHubAttachment[];
  activeAttachmentId: string | null;
  loadingId: string | null;
  loadAttachment?: GmailLoadAttachmentFn;
  onOpenPdf: (att: GmailHubAttachment, preview?: GmailPdfAttachmentPreview | null) => void;
};

/** Tuiles PDF carrées avec mini-aperçu — clic ouvre le PDF en plein panneau. */
export default function GmailHubAttachments({
  messageId,
  attachments,
  activeAttachmentId,
  loadingId,
  loadAttachment,
  onOpenPdf,
}: Props) {
  const pdfAttachments = attachments.filter(isPdf);
  const { previews, thumbnailLoading } = useGmailPdfAttachmentPreviews(
    messageId,
    attachments,
    loadAttachment,
  );

  if (pdfAttachments.length === 0) return null;

  const tileSizePx = 132;
  const maxRowWidth =
    pdfAttachments.length === 1
      ? tileSizePx
      : tileSizePx * 2 + 10; /* gap-2.5 */

  return (
    <div
      data-testid="gmail-hub-attachments"
      className={`flex w-full shrink-0 justify-center border-b ${gmailDivider} px-4 py-3`}
    >
      <ul
        className="mx-auto flex flex-wrap justify-center gap-2.5"
        style={{ maxWidth: maxRowWidth }}
        data-testid="gmail-hub-attachments-grid"
      >
        {pdfAttachments.map((att) => {
          const selected = activeAttachmentId === att.attachmentId;
          const opening = loadingId === att.attachmentId;
          const thumbLoading = Boolean(thumbnailLoading[att.attachmentId]);
          const preview = previews[att.attachmentId] ?? null;
          const meta = att.size > 0 ? formatBytes(att.size) : null;

          return (
            <li key={att.attachmentId} className="size-[132px] shrink-0">
              <button
                type="button"
                data-testid={`gmail-hub-attachment-${att.attachmentId}`}
                onClick={() => onOpenPdf(att, preview)}
                aria-label={att.filename}
                className={cn(
                  "group relative size-full overflow-hidden rounded-[18px] text-left",
                  "border border-black/[0.06] bg-white/55 backdrop-blur-[2px]",
                  "transition-[border-color,box-shadow,background-color] duration-300 ease-out",
                  "hover:border-black/[0.09] hover:bg-white/80 hover:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15",
                  selected &&
                    "border-black/[0.1] bg-white shadow-[0_10px_28px_-18px_rgba(15,23,42,0.28)] ring-1 ring-inset ring-black/[0.06]",
                )}
              >
                <div className="relative size-full overflow-hidden bg-slate-100/80">
                  {preview?.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniature pdf.js (évite UI Safari)
                    <img
                      data-testid={`gmail-hub-attachment-preview-${att.attachmentId}`}
                      src={preview.thumbnailUrl}
                      alt=""
                      className="pointer-events-none absolute inset-0 size-full object-cover object-top"
                    />
                  ) : (
                    <span
                      className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-slate-300/90"
                      aria-hidden
                    >
                      {thumbLoading || opening ? (
                        <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.15} />
                      ) : (
                        <FileText className="h-7 w-7" strokeWidth={1.15} />
                      )}
                    </span>
                  )}
                  {(thumbLoading || opening) && preview?.thumbnailUrl ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-500" strokeWidth={1.5} />
                    </div>
                  ) : null}
                  <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm">
                    PDF
                  </span>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-white/95 via-white/85 to-transparent px-2 pb-1.5 pt-6">
                  <span className="block truncate text-[11px] font-medium leading-tight text-slate-800">
                    {att.filename}
                  </span>
                  {meta ? (
                    <span className="mt-0.5 block truncate text-[9px] tabular-nums text-slate-400">
                      {meta}
                    </span>
                  ) : null}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
