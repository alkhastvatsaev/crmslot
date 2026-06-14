"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { TRACKING_PROGRESS_SEGMENT_COUNT } from "@/features/interventions/requesterTrackingSteps";

type Props = {
  progressIndex: number;
};

export default function RequesterTrackingProgressBar({ progressIndex }: Props) {
  const { t } = useTranslation();

  if (progressIndex < 0) return null;

  return (
    <div
      data-testid="tracking-progress-bar"
      className="w-full max-w-[280px] shrink-0 px-1 pt-4"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={TRACKING_PROGRESS_SEGMENT_COUNT}
      aria-valuenow={progressIndex + 1}
      aria-label={String(t("tracking.progress_aria"))}
    >
      <div className="flex gap-1">
        {Array.from({ length: TRACKING_PROGRESS_SEGMENT_COUNT }, (_, index) => (
          <div
            key={index}
            data-testid={`tracking-progress-segment-${index}`}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              index <= progressIndex ? "bg-slate-900" : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}
