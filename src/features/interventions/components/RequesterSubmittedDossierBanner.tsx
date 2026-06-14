"use client";

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
          compact ? "text-[18px]" : "text-[26px]"
        )}
      >
        {dossierNumber}
      </p>
      {!compact ? (
        <p className="mt-3 text-[13px] leading-relaxed text-emerald-900/70">
          {t("requester.intervention.submitted_dossier_hint")}
        </p>
      ) : null}
    </div>
  );
}
