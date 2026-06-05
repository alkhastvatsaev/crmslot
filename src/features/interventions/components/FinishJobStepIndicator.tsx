"use client";

import { Camera, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";

export type FinishJobStep = "photos" | "signature";

const STEPS: FinishJobStep[] = ["photos", "signature"];

const stepMeta: Record<
  FinishJobStep,
  { labelKey: string; Icon: typeof Camera; testId: string }
> = {
  photos: {
    labelKey: "technician_hub.finish.steps.photos",
    Icon: Camera,
    testId: "finish-step-photos",
  },
  signature: {
    labelKey: "technician_hub.finish.steps.signature",
    Icon: FileSignature,
    testId: "finish-step-signature",
  },
};

type Props = {
  current: FinishJobStep;
  className?: string;
  /** Icônes seules — pied de page wizard terrain. */
  compact?: boolean;
};

export default function FinishJobStepIndicator({ current, className, compact = false }: Props) {
  const { t } = useTranslation();
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav
      data-testid="finish-job-step-indicator"
      aria-label={String(t("technician_hub.finish.steps.aria"))}
      className={cn("flex items-center gap-1", className)}
    >
      {STEPS.map((step, index) => {
        const { labelKey, Icon, testId } = stepMeta[step];
        const done = index < currentIndex;
        const active = step === current;
        return (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-1">
            <div
              data-testid={testId}
              data-active={active ? "true" : "false"}
              data-done={done ? "true" : "false"}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center rounded-xl text-center transition-colors",
                compact ? "py-2" : "flex-col gap-1 px-1 py-2",
                active && "bg-slate-900 text-white",
                done && !active && "bg-emerald-50 text-emerald-800",
                !active && !done && "bg-slate-50 text-slate-400",
              )}
            >
              <Icon className={cn("shrink-0", compact ? "h-4 w-4" : "h-4 w-4")} aria-hidden />
              {compact ? (
                <span className="sr-only">{String(t(labelKey))}</span>
              ) : (
                <span className="truncate text-[10px] font-bold uppercase tracking-wide">
                  {String(t(labelKey))}
                </span>
              )}
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "h-0.5 w-2 shrink-0 rounded-full",
                  index < currentIndex ? "bg-emerald-400" : "bg-slate-200",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
