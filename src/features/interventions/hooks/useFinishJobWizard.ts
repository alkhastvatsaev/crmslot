"use client";

import { useCallback, useRef, useState } from "react";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useDashboardPagerOptional } from "@/features/dashboard";
import { FINISH_JOB_MIN_PHOTOS } from "@/features/interventions/finishJobConstants";
import type { FinishJobStep } from "@/features/interventions/components/FinishJobStepIndicator";
import type { TechnicianSignaturePadHandle } from "@/features/interventions/components/TechnicianSignaturePad";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import { useFinishJobWizardCamera } from "@/features/interventions/hooks/useFinishJobWizardCamera";
import { useFinishJobWizardEffects } from "@/features/interventions/hooks/useFinishJobWizardEffects";
import { useFinishJobWizardSubmit } from "@/features/interventions/hooks/useFinishJobWizardSubmit";
import type { FinishWizardPhoto } from "@/features/interventions/technicianCompletionReport";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { useTranslation } from "@/core/i18n/I18nContext";

export function useFinishJobWizard() {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const {
    finishJobInterventionId,
    finishJobEntryStep,
    setFinishJobInterventionId,
    setFinishWizardStep,
  } = useTechnicianFinishJob();

  const [step, setStep] = useState<FinishJobStep>("photos");
  const [draftBillingLines, setDraftBillingLines] = useState<DraftBillingLine[]>([]);
  const [draftAiNote, setDraftAiNote] = useState<string | null>(null);
  const [photos, setPhotos] = useState<FinishWizardPhoto[]>([]);
  const [preservedSignatureUrl, setPreservedSignatureUrl] = useState<string | null>(null);
  const sigRef = useRef<TechnicianSignaturePadHandle>(null);
  const hydratedReportRef = useRef<string | null>(null);

  const interventionId = finishJobInterventionId;
  const liveIv = useInterventionLive(interventionId);
  const liveStatus = liveIv?.status;
  const isAmendMode = liveStatus === "done";
  const isInvoicedAmendMode = liveStatus === "invoiced";

  const { videoRef, stopCamera, captureShot, removePhoto } = useFinishJobWizardCamera({
    interventionId,
    step,
    photos,
    setPhotos,
    t,
  });

  const resetWizard = useCallback(() => {
    stopCamera();
    setPhotos([]);
    sigRef.current?.clear();
    setPreservedSignatureUrl(null);
    setStep("photos");
    setDraftBillingLines([]);
    setDraftAiNote(null);
    hydratedReportRef.current = null;
  }, [stopCamera]);

  const { prefetchDraftBilling } = useFinishJobWizardEffects({
    interventionId,
    finishJobEntryStep,
    step,
    setStep,
    setFinishWizardStep,
    liveIv,
    isAmendMode,
    isInvoicedAmendMode,
    resetWizard,
    hydratedReportRef,
    setPhotos,
    setPreservedSignatureUrl,
    setDraftBillingLines,
    setDraftAiNote,
  });

  const { submitBusy, submitAll, goDashboard, goToSignature, handleInvoiceSent } =
    useFinishJobWizardSubmit({
      interventionId,
      liveIv,
      isAmendMode,
      isInvoicedAmendMode,
      photos,
      preservedSignatureUrl,
      sigRef,
      stopCamera,
      setStep,
      resetWizard,
      setFinishJobInterventionId,
      pager,
      prefetchDraftBilling,
      t,
    });

  const photosReady = photos.length >= FINISH_JOB_MIN_PHOTOS;

  return {
    pager,
    interventionId,
    liveIv,
    step,
    setStep,
    photos,
    videoRef,
    sigRef,
    captureShot,
    removePhoto,
    draftBillingLines,
    draftAiNote,
    preservedSignatureUrl,
    setPreservedSignatureUrl,
    submitBusy,
    submitAll,
    goDashboard,
    goToSignature,
    handleInvoiceSent,
    photosReady,
  };
}
