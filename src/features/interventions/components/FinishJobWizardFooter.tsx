"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN_ICON } from "@/features/interventions/terrainMobileChrome";
import FinishJobStepIndicator, {
  type FinishJobStep,
} from "@/features/interventions/components/FinishJobStepIndicator";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  step: FinishJobStep;
  photosReady: boolean;
  submitBusy: boolean;
  onGoToSignature: () => void;
  onBackToPhotos: () => void;
  onClearSignature: () => void;
  onSubmit: () => void;
};

export default function FinishJobWizardFooter({
  step,
  photosReady,
  submitBusy,
  onGoToSignature,
  onBackToPhotos,
  onClearSignature,
  onSubmit,
}: Props) {
  const { t } = useTranslation();

  if (step === "closed") return null;

  return (
    <footer className="shrink-0 border-t border-slate-100 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <FinishJobStepIndicator current={step} />

      {step === "photos" ? (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            data-testid="finish-job-continue-photos"
            disabled={!photosReady}
            onClick={onGoToSignature}
            aria-label={String(t("technician_hub.finish.continue_signature"))}
            className={cn(
              "flex h-12 w-12 items-center justify-center bg-slate-900 text-white shadow-md transition active:scale-95 disabled:opacity-30",
              TERRAIN_BTN_ICON
            )}
          >
            <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>
      ) : null}

      {step === "billing" ? null : step === "signature" ? (
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            type="button"
            data-testid="finish-job-back-photos"
            onClick={onBackToPhotos}
            aria-label={String(t("technician_hub.finish.back_photos"))}
            className={cn(
              "flex h-11 w-11 items-center justify-center bg-slate-100 text-slate-700 transition active:scale-95",
              TERRAIN_BTN_ICON
            )}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            data-testid="finish-job-clear-signature"
            onClick={onClearSignature}
            aria-label={String(t("technician_hub.finish.clear_signature"))}
            className={cn(
              "flex h-11 w-11 items-center justify-center bg-slate-100 text-rose-600 transition active:scale-95",
              TERRAIN_BTN_ICON
            )}
          >
            <RotateCcw className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            data-testid="finish-job-submit"
            disabled={submitBusy}
            onClick={onSubmit}
            aria-label={String(t("technician_hub.finish.send_closure"))}
            className={cn(
              "flex h-12 w-12 items-center justify-center bg-emerald-500 text-white shadow-md transition active:scale-95 disabled:opacity-60",
              TERRAIN_BTN_ICON
            )}
          >
            {submitBusy ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Check className="h-6 w-6 stroke-[3]" aria-hidden />
            )}
          </button>
        </div>
      ) : null}
    </footer>
  );
}
