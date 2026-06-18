"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";

export type FinishJobStep = "photos" | "signature" | "billing";

const STEPS: FinishJobStep[] = ["photos", "signature", "billing"];

const stepMeta: Record<FinishJobStep, { labelKey: string; testId: string }> = {
  photos: {
    labelKey: "technician_hub.finish.steps.photos",
    testId: "finish-step-photos",
  },
  signature: {
    labelKey: "technician_hub.finish.steps.signature",
    testId: "finish-step-signature",
  },
  billing: {
    labelKey: "technician_hub.finish.steps.billing",
    testId: "finish-step-billing",
  },
};

type Props = {
  current: FinishJobStep;
  className?: string;
  /** @deprecated Toujours en mode points — conservé pour compat. */
  compact?: boolean;
};

/** Indicateur d’étapes clôture — trois points, sans icônes. */
export default function FinishJobStepIndicator({ current, className }: Props) {
  const { t } = useTranslation();
  const currentIndex = STEPS.indexOf(current);

  return (
    <nav
      data-testid="finish-job-step-indicator"
      aria-label={String(t("technician_hub.finish.steps.aria"))}
      className={cn("flex items-center justify-center gap-2 py-1", className)}
    >
      {STEPS.map((step, index) => {
        const { labelKey, testId } = stepMeta[step];
        const done = index < currentIndex;
        const active = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <span
              data-testid={testId}
              data-active={active ? "true" : "false"}
              data-done={done ? "true" : "false"}
              role="img"
              aria-label={String(t(labelKey))}
              className={cn(
                "rounded-full transition-all duration-200",
                active && "h-2.5 w-2.5 bg-slate-900",
                done && !active && "h-2 w-2 bg-slate-500",
                !active && !done && "h-2 w-2 bg-slate-200"
              )}
            />
            {index < STEPS.length - 1 ? (
              <span
                className={cn(
                  "h-px w-5 shrink-0",
                  index < currentIndex ? "bg-slate-400" : "bg-slate-200"
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
