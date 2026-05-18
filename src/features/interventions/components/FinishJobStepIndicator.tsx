"use client";

import { Camera, FileSignature, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";

export type FinishJobStep = "photos" | "billing" | "signature";

const STEPS: FinishJobStep[] = ["photos", "billing", "signature"];

const stepMeta: Record<
  FinishJobStep,
  { labelKey: string; Icon: typeof Camera; testId: string }
> = {
  photos: {
    labelKey: "technician_hub.finish.steps.photos",
    Icon: Camera,
    testId: "finish-step-photos",
  },
  billing: {
    labelKey: "technician_hub.finish.steps.billing",
    Icon: FileText,
    testId: "finish-step-billing",
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
};

export default function FinishJobStepIndicator({ current, className }: Props) {
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
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center transition-colors",
                active && "bg-slate-900 text-white",
                done && !active && "bg-emerald-50 text-emerald-800",
                !active && !done && "bg-slate-50 text-slate-400",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate text-[10px] font-bold uppercase tracking-wide">
                {String(t(labelKey))}
              </span>
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
