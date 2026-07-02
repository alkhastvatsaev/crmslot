"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { useRequesterInterventionForm } from "@/features/interventions/hooks/useRequesterInterventionForm";
import { REQUESTER_GEOLOC_ADDRESS_PENDING } from "@/features/interventions/smartInterventionConstants";
import {
  REQUESTER_INTERVENTION_ENTER_SUBMIT_EVENT,
  SMART_FORM_TEMPLATES,
  type SmartFormTemplate,
} from "@/features/interventions/smartInterventionConstants";
import { useBrowserSpeechDictation } from "@/features/interventions/useBrowserSpeechDictation";

export function useRequesterInterventionPanelController() {
  const {
    requestData,
    setRequestData,
    currentStep,
    setCurrentStep,
    isSubmitting,
    validationFailedCount,
    lastSubmittedPortalAccessCode,
    setLastSubmittedPortalAccessCode,
    resetRequestOnly,
  } = useRequesterHub();

  const { t, language } = useTranslation();

  const {
    tenantCompanyId,
    locatingAddress,
    canSubmit,
    handleSubmit,
    handleAudioRecorded,
    fillAddressFromGeolocation,
    ingestFiles,
    removePhoto,
  } = useRequesterInterventionForm();

  const {
    problemTemplateId,
    problemLabel,
    description,
    interventionAddress,
    interventionLatLng,
    interventionDate,
    interventionTime,
    audioBlob,
    photoDataUrls,
    urgency: requestDataUrgency,
  } = requestData;

  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const addressSnapshotRef = useRef("");

  useEffect(() => {
    const snapshot = `${interventionAddress}|${interventionLatLng?.lat ?? ""}|${interventionLatLng?.lng ?? ""}`;
    if (snapshot !== addressSnapshotRef.current) {
      addressSnapshotRef.current = snapshot;
      setAddressConfirmed(false);
    }
  }, [interventionAddress, interventionLatLng?.lat, interventionLatLng?.lng]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!problemTemplateId && problemLabel.includes("smart_form.templates.")) {
      const tpl = SMART_FORM_TEMPLATES.find((x) => x.label === problemLabel);
      if (tpl) {
        setRequestData((prev) => {
          if (prev.problemTemplateId) return prev;
          return {
            ...prev,
            problemTemplateId: tpl.id,
            problemLabel: String(t(tpl.label)),
            description: prev.description.trim() ? prev.description : String(t(tpl.seed)),
          };
        });
      }
      return;
    }
    if (!problemTemplateId) return;
    const tpl = SMART_FORM_TEMPLATES.find((x) => x.id === problemTemplateId);
    if (!tpl) return;
    const nextLabel = String(t(tpl.label));
    setRequestData((prev) => {
      if (prev.problemLabel === nextLabel) return prev;
      return { ...prev, problemLabel: nextLabel };
    });
  }, [language, problemTemplateId, problemLabel, t, setRequestData]);

  const appendDescriptionFromVoice = useCallback(
    (piece: string) => {
      setRequestData((prev) => {
        const existing = prev.description.trimEnd();
        return { ...prev, description: existing ? `${existing} ${piece}` : piece };
      });
    },
    [setRequestData]
  );

  const {
    listening: descriptionVoiceListening,
    supported: descriptionVoiceSupported,
    toggleListening: toggleDescriptionVoice,
    interimTranscript,
  } = useBrowserSpeechDictation(appendDescriptionFromVoice, handleAudioRecorded);

  const hasValidAddress =
    interventionAddress.trim().length > 0 &&
    interventionAddress !== REQUESTER_GEOLOC_ADDRESS_PENDING;

  const canSubmitStep4 = Boolean(canSubmit && (!hasValidAddress || addressConfirmed));

  const trySubmitOnEnter = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.defaultPrevented) return;
      if (currentStep !== 4 || !canSubmitStep4 || isSubmitting) return;
      e.preventDefault();
      void handleSubmit();
    },
    [currentStep, canSubmitStep4, isSubmitting, handleSubmit]
  );

  useEffect(() => {
    if (currentStep !== 4) return;
    const onEnterSubmit = () => {
      if (!canSubmitStep4 || isSubmitting) return;
      void handleSubmit();
    };
    window.addEventListener(REQUESTER_INTERVENTION_ENTER_SUBMIT_EVENT, onEnterSubmit);
    return () =>
      window.removeEventListener(REQUESTER_INTERVENTION_ENTER_SUBMIT_EVENT, onEnterSubmit);
  }, [currentStep, canSubmitStep4, isSubmitting, handleSubmit]);

  const handleProblemSelect = useCallback(
    (tpl: SmartFormTemplate) => {
      setLastSubmittedPortalAccessCode(null);
      const labelText = String(t(tpl.label));
      const seedText = String(t(tpl.seed));
      setRequestData((prev) => ({
        ...prev,
        problemTemplateId: tpl.id,
        problemLabel: labelText,
        description: prev.description.trim() ? prev.description : seedText,
      }));
      setCurrentStep(1);
    },
    [setLastSubmittedPortalAccessCode, setRequestData, setCurrentStep, t]
  );

  const showSubmitSuccess = Boolean(
    lastSubmittedPortalAccessCode &&
    currentStep === 4 &&
    !isSubmitting &&
    !problemLabel.trim() &&
    !description.trim() &&
    !interventionAddress.trim()
  );

  const handleNewRequest = useCallback(() => {
    setLastSubmittedPortalAccessCode(null);
    resetRequestOnly();
  }, [resetRequestOnly, setLastSubmittedPortalAccessCode]);

  return {
    currentStep,
    setCurrentStep,
    setRequestData,
    isSubmitting,
    validationFailedCount,
    lastSubmittedPortalAccessCode,
    tenantCompanyId,
    locatingAddress,
    canSubmit: canSubmitStep4,
    addressConfirmed,
    setAddressConfirmed,
    hasValidAddress,
    handleSubmit,
    fillAddressFromGeolocation,
    ingestFiles,
    removePhoto,
    problemTemplateId,
    problemLabel,
    description,
    interventionAddress,
    interventionLatLng,
    interventionDate,
    interventionTime,
    audioBlob,
    photoDataUrls,
    requestDataUrgency,
    fileInputRef,
    descriptionVoiceListening,
    descriptionVoiceSupported,
    toggleDescriptionVoice,
    interimTranscript,
    trySubmitOnEnter,
    handleProblemSelect,
    showSubmitSuccess,
    handleNewRequest,
  };
}
