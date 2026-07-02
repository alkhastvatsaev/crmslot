"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { toast } from "sonner";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  showNewRequest?: boolean;
  onNewRequest?: () => void;
};

export default function RequesterInterventionStepperHeader({
  showNewRequest = false,
  onNewRequest,
}: Props) {
  const { currentStep, setCurrentStep, requestData, triggerValidation } = useRequesterHub();
  const { t } = useTranslation();

  const handleNext = () => {
    if (currentStep === 2 && requestData.photoDataUrls.length === 0) {
      toast.error(String(t("requester.toasts.min_one_photo")));
      triggerValidation();
      return;
    }
    if (currentStep < 4) setCurrentStep((prev) => prev + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const showNext = currentStep > 0 && currentStep < 4;

  return (
    <div className="flex shrink-0 items-center justify-between gap-2">
      <div className="flex w-[132px] shrink-0 justify-start">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 0}
          aria-label={String(t("requester.intervention.step_back_aria"))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="flex min-w-0 flex-1 justify-center gap-1.5"
        aria-label={String(t("requester.intervention.step_progress_aria"))}
        role="status"
      >
        {[0, 1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              currentStep === step ? "w-4 bg-black" : "w-1.5 bg-slate-200"
            )}
          />
        ))}
      </div>

      <div className="flex w-[132px] shrink-0 justify-end">
        {showNewRequest ? (
          <button
            type="button"
            data-testid="requester-new-request-btn"
            onClick={onNewRequest}
            className="flex h-8 max-w-full items-center gap-1 rounded-full bg-blue-500 px-2.5 text-[10px] font-semibold leading-none text-white shadow-sm transition-colors hover:bg-blue-600 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
            <span className="truncate">{String(t("requester.ux.new_request"))}</span>
          </button>
        ) : showNext ? (
          <button
            type="button"
            onClick={handleNext}
            aria-label={String(t("requester.intervention.step_next_aria"))}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-600"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
