"use client";

import { useCallback, useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";

type Props = {
  dossierNumber: string;
  compact?: boolean;
  className?: string;
};

export default function RequesterSubmittedDossierBanner({
  dossierNumber,
  compact = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(dossierNumber.replace(/\s+/g, ""));
      setCopied(true);
      toast.success(String(t("requester.ux.dossier_copied")));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [dossierNumber, t]);

  return (
    <div
      data-testid="requester-submitted-dossier-banner"
      className={cn(
        "rounded-[20px] border border-emerald-200/80 bg-emerald-50/90 text-center",
        compact ? "px-4 py-3" : "px-6 py-5",
        className
      )}
    >
      <p className={cn("font-semibold text-emerald-900", compact ? "text-[13px]" : "text-[15px]")}>
        {t("requester.intervention.submitted_title")}
      </p>
      <p className="mt-1 text-[12px] font-medium text-emerald-800/80">
        {t("requester.intervention.submitted_dossier_label")}
      </p>
      <p
        data-testid="requester-submitted-dossier-number"
        className={cn(
          "mt-2 font-mono font-bold tracking-[0.22em] text-emerald-950",
          compact ? "text-[22px]" : "text-[30px]"
        )}
      >
        {dossierNumber}
      </p>
      <button
        type="button"
        data-testid="requester-dossier-copy"
        onClick={() => void handleCopy()}
        className="mx-auto mt-3 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[12px] border border-emerald-300/80 bg-white/90 px-4 py-2.5 text-[13px] font-semibold text-emerald-900 transition hover:bg-white"
      >
        {copied ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Copy className="h-4 w-4" aria-hidden />
        )}
        {String(t("requester.ux.dossier_copy"))}
      </button>
      {!compact ? (
        <p className="mt-3 text-[13px] leading-relaxed text-emerald-900/70">
          {t("requester.intervention.submitted_dossier_hint")}
        </p>
      ) : null}
    </div>
  );
}
