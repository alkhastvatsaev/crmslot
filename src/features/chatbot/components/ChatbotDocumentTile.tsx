"use client";

import { FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";

export type ChatbotDocumentTileKind = "invoice" | "order";

export type ChatbotDocumentTileProps = {
  testId: string;
  active: boolean;
  disabled?: boolean;
  kind: ChatbotDocumentTileKind;
  title: string;
  subtitle?: string;
  meta?: string;
  thumbnailUrl?: string | null;
  thumbnailLoading?: boolean;
  onClick: () => void;
};

export function ChatbotDocumentTile({
  testId,
  active,
  disabled,
  kind,
  title,
  subtitle,
  meta,
  thumbnailUrl,
  thumbnailLoading,
  onClick,
}: ChatbotDocumentTileProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative aspect-square w-full overflow-hidden rounded-[18px] text-left",
        "border border-black/[0.06] bg-white/55 backdrop-blur-[2px]",
        "transition-[border-color,box-shadow,background-color] duration-300 ease-out",
        "hover:border-black/[0.09] hover:bg-white/80 hover:shadow-[0_12px_32px_-20px_rgba(15,23,42,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15",
        "disabled:pointer-events-none disabled:opacity-40",
        active &&
          "border-black/[0.1] bg-white shadow-[0_10px_28px_-18px_rgba(15,23,42,0.28)] ring-1 ring-inset ring-black/[0.06]"
      )}
    >
      <div className="relative size-full overflow-hidden bg-slate-100/80">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniature pdf.js
          <img
            data-testid={`${testId}-preview`}
            src={thumbnailUrl}
            alt=""
            className="pointer-events-none absolute inset-0 size-full object-cover object-top"
          />
        ) : (
          <span
            className={cn(
              "pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2",
              "text-slate-300/90 transition-colors duration-300 group-hover:text-slate-400/90",
              active && "text-slate-400"
            )}
            aria-hidden
          >
            {thumbnailLoading ? (
              <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.15} />
            ) : (
              <FileText className="h-7 w-7" strokeWidth={1.15} />
            )}
          </span>
        )}
        <span
          className={cn(
            "absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-500 shadow-sm",
            active && "text-slate-600"
          )}
        >
          {kind === "invoice"
            ? String(t("chatbot.doc_badge_invoice"))
            : String(t("chatbot.doc_badge_order"))}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-white/95 via-white/85 to-transparent px-2 pb-1.5 pt-6">
        <span className="block truncate text-[12px] font-medium leading-tight tracking-[-0.02em] text-slate-800">
          {title}
        </span>
        {subtitle ? (
          <span className="mt-0.5 block truncate text-[10px] leading-tight text-slate-500">
            {subtitle}
          </span>
        ) : null}
        {meta ? (
          <span className="mt-0.5 block truncate text-[10px] tabular-nums text-slate-400">
            {meta}
          </span>
        ) : null}
      </div>
    </button>
  );
}
