"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { useTranslation } from "@/core/i18n/I18nContext";

const STEP_LABEL_KEYS = [
  "requester.ux.step_label_problem",
  "requester.ux.step_label_detail",
  "requester.ux.step_label_photos",
  "requester.ux.step_label_slot",
  "requester.ux.step_label_place",
] as const;

export default function RequesterInterventionStepperHeader() {
  const { currentStep, setCurrentStep } = useRequesterHub();
  const { t } = useTranslation();

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          aria-label={String(t("requester.intervention.step_back_aria"))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div className="flex flex-col items-center gap-1">
          <div
            className="flex gap-1.5"
            aria-label={String(t("requester.intervention.step_progress_aria"))}
            role="status"
          >
            {[0, 1, 2, 3, 4].map((step) => (
              <div
                key={step}
                data-testid={`requester-step-dot-${step}`}
                title={String(t(STEP_LABEL_KEYS[step]))}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentStep === step ? "w-4 bg-black" : "w-1.5 bg-slate-200"
                )}
              />
            ))}
          </div>
          <p data-testid="requester-step-label" className="text-[11px] font-medium text-slate-500">
            {String(t(STEP_LABEL_KEYS[currentStep]))}
          </p>
        </div>

        <div className="w-9">
          {currentStep > 0 && currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              aria-label={String(t("requester.intervention.step_next_aria"))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-600"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
