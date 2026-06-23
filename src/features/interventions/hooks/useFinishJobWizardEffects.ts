"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { FinishJobEntryStep } from "@/context/TechnicianFinishJobContext";
import type { FinishJobStep } from "@/features/interventions/components/FinishJobStepIndicator";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import { prefetchFinishJobDraftBilling } from "@/features/interventions/hooks/finishJobWizardDraftBilling";
import {
  finishWizardPhotosFromIntervention,
  type FinishWizardPhoto,
} from "@/features/interventions/technicianCompletionReport";
import type { Intervention } from "@/features/interventions/types";

type Args = {
  interventionId: string | null;
  finishJobEntryStep: FinishJobEntryStep | null;
  step: FinishJobStep;
  setStep: Dispatch<SetStateAction<FinishJobStep>>;
  setFinishWizardStep: (step: FinishJobStep | null) => void;
  liveIv: Intervention | null | undefined;
  isAmendMode: boolean;
  isInvoicedAmendMode: boolean;
  resetWizard: () => void;
  hydratedReportRef: MutableRefObject<string | null>;
  setPhotos: Dispatch<SetStateAction<FinishWizardPhoto[]>>;
  setPreservedSignatureUrl: Dispatch<SetStateAction<string | null>>;
  setDraftBillingLines: Dispatch<SetStateAction<DraftBillingLine[]>>;
  setDraftAiNote: Dispatch<SetStateAction<string | null>>;
};

export function useFinishJobWizardEffects({
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
}: Args) {
  const wizardMissionIdRef = useRef<string | null>(null);

  const applyDraftBilling = useCallback(
    async (ivId: string) => {
      const payload = await prefetchFinishJobDraftBilling(ivId);
      if (!payload) return;
      setDraftBillingLines(payload.billingLines);
      setDraftAiNote(payload.aiNote);
    },
    [setDraftAiNote, setDraftBillingLines]
  );

  useEffect(() => {
    if (!interventionId) {
      wizardMissionIdRef.current = null;
      return;
    }
    if (wizardMissionIdRef.current === interventionId) return;
    wizardMissionIdRef.current = interventionId;
    resetWizard();
    if (finishJobEntryStep === "invoice") {
      setStep("billing");
      void applyDraftBilling(interventionId);
    }
  }, [applyDraftBilling, interventionId, finishJobEntryStep, resetWizard, setStep]);

  useEffect(() => {
    if (!interventionId || isAmendMode || isInvoicedAmendMode) return;
    void applyDraftBilling(interventionId);
  }, [applyDraftBilling, interventionId, isAmendMode, isInvoicedAmendMode]);

  useEffect(() => {
    if (!liveIv || hydratedReportRef.current === liveIv.id) return;
    if (liveIv.status !== "done" && liveIv.status !== "invoiced") return;
    hydratedReportRef.current = liveIv.id;
    const existingPhotos = finishWizardPhotosFromIntervention(liveIv);
    if (existingPhotos.length > 0) {
      setPhotos(existingPhotos);
    }
    const existingSignature = liveIv.completionSignatureUrl?.trim();
    if (existingSignature) {
      setPreservedSignatureUrl(existingSignature);
    }
  }, [liveIv, setPhotos, setPreservedSignatureUrl]);

  useEffect(() => {
    if (!interventionId) {
      setFinishWizardStep(null);
      return;
    }
    setFinishWizardStep(step);
  }, [interventionId, step, setFinishWizardStep]);

  useEffect(() => {
    return () => setFinishWizardStep(null);
  }, [interventionId, setFinishWizardStep]);

  return { prefetchDraftBilling: applyDraftBilling };
}
