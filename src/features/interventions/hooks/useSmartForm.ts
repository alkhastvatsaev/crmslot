"use client";

import { useCallback, useState } from "react";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import {
  REQUESTER_GEOLOC_ADDRESS_PENDING,
  smartFormAddressEligibleForStep2,
} from "@/features/interventions/smartInterventionConstants";
import {
  emptyDraft,
  initialStepFromPayload,
  loadStorageDraft,
} from "@/features/interventions/smartFormDraftStorage";
import { submitSmartFormIntervention } from "@/features/interventions/smartFormSubmit";
import type { WizardStep } from "@/features/interventions/smartFormTypes";
import { useSmartFormDraftEffects } from "@/features/interventions/hooks/useSmartFormDraftEffects";
import { useSmartFormGeolocation } from "@/features/interventions/hooks/useSmartFormGeolocation";
import { useSmartFormPhotoIngest } from "@/features/interventions/hooks/useSmartFormPhotoIngest";
import { useAudioRecorder } from "@/features/interventions/useAudioRecorder";
import { useTranslation } from "@/core/i18n/I18nContext";

export type { DraftPayload, WizardStep } from "@/features/interventions/smartFormTypes";
export { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/smartFormTypes";
export { emptyDraft, loadStorageDraft } from "@/features/interventions/smartFormDraftStorage";

export function useSmartForm() {
  const workspace = useCompanyWorkspaceOptional();
  const tenantCompanyId =
    workspace?.isTenantUser && workspace.activeCompanyId ? workspace.activeCompanyId : null;
  const interventionCompanyId = tenantCompanyId;

  const stored = typeof window !== "undefined" ? loadStorageDraft() : null;
  const initialPayload = stored ? { ...emptyDraft(), ...stored.payload } : emptyDraft();
  const { language } = useTranslation();

  const [address, setAddress] = useState(initialPayload.address);
  const [description, setDescription] = useState(initialPayload.description ?? "");
  const [urgency, setUrgency] = useState(initialPayload.urgency);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>(initialPayload.photoDataUrls ?? []);
  const [placeLatLng, setPlaceLatLng] = useState<{ lat: number; lng: number } | undefined>(
    initialPayload.placeLatLng
  );
  const [firstName, setFirstName] = useState(initialPayload.firstName ?? "");
  const [lastName, setLastName] = useState(initialPayload.lastName ?? "");
  const [phone, setPhone] = useState(initialPayload.phone ?? "");
  const [scheduledDate, setScheduledDate] = useState(initialPayload.scheduledDate ?? "");
  const [scheduledTime, setScheduledTime] = useState(initialPayload.scheduledTime ?? "");
  const [audioTranscription, setAudioTranscription] = useState(
    initialPayload.audioTranscription ?? ""
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(
    initialPayload.audioBlob instanceof Blob ? initialPayload.audioBlob : null
  );
  const [demoAudioUrl, setDemoAudioUrl] = useState<string | null>(null);
  const [demoAudioSaving, setDemoAudioSaving] = useState(false);
  const [pregeneratedDocId, setPregeneratedDocId] = useState<string>("");
  const [parentInterventionId, setParentInterventionId] = useState<string | null>(null);

  const [step, setStep] = useState<WizardStep>(() => initialStepFromPayload(initialPayload));
  const [takenSlots, setTakenSlots] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [recapPhotosOpen, setRecapPhotosOpen] = useState(false);

  const audioRecorder = useAudioRecorder({ language });

  const { locatingAddress, addressInputRef, fillAddressFromGeolocation } = useSmartFormGeolocation(
    setAddress,
    setPlaceLatLng
  );

  const { fileInputRef, ingestFiles, removePhoto } = useSmartFormPhotoIngest(setPhotoDataUrls);

  useSmartFormDraftEffects({
    address,
    description,
    urgency,
    photoDataUrls,
    placeLatLng,
    firstName,
    lastName,
    phone,
    scheduledDate,
    scheduledTime,
    audioTranscription,
    step,
    interventionCompanyId,
    pregeneratedDocId,
    setPregeneratedDocId,
    setTakenSlots,
    setParentInterventionId,
    setAddress,
    setUrgency,
    setPhotoDataUrls,
    setPlaceLatLng,
    setFirstName,
    setLastName,
    setPhone,
    setScheduledDate,
    setScheduledTime,
    setAudioTranscription,
    setStep,
    audioBlob,
    setDemoAudioUrl,
    setDemoAudioSaving,
    recapPhotosOpen,
    setRecapPhotosOpen,
    audioRecorderBlob: audioRecorder.audioBlob,
    audioRecorderTranscription: audioRecorder.transcription,
    setAudioBlob,
  });

  const resetForm = useCallback(() => {
    setAddress("");
    setUrgency(false);
    setPhotoDataUrls([]);
    setPlaceLatLng(undefined);
    setFirstName("");
    setLastName("");
    setPhone("");
    setScheduledTime("");
    setAudioTranscription("");
    setAudioBlob(null);
    audioRecorder.resetRecording();
    setStep(1);
  }, [audioRecorder]);

  const handleSubmit = useCallback(async () => {
    await submitSmartFormIntervention({
      address,
      description,
      urgency,
      photoDataUrls,
      placeLatLng,
      firstName,
      lastName,
      phone,
      scheduledDate,
      scheduledTime,
      audioTranscription,
      audioBlob,
      demoAudioUrl,
      parentInterventionId,
      tenantCompanyId,
      interventionCompanyId,
      isTenantUser: !!workspace?.isTenantUser,
      audioRecorder,
      setBusy,
      resetForm,
    });
  }, [
    address,
    audioBlob,
    audioRecorder,
    audioTranscription,
    demoAudioUrl,
    description,
    firstName,
    interventionCompanyId,
    lastName,
    parentInterventionId,
    phone,
    photoDataUrls,
    placeLatLng,
    resetForm,
    scheduledDate,
    scheduledTime,
    tenantCompanyId,
    urgency,
    workspace?.isTenantUser,
  ]);

  const canSubmit =
    step === 5 &&
    address.trim().length > 0 &&
    (description.trim().length > 0 || audioTranscription.trim().length > 0 || audioBlob !== null) &&
    !(workspace?.isTenantUser && !tenantCompanyId);

  const canContinueAddress =
    address !== REQUESTER_GEOLOC_ADDRESS_PENDING &&
    smartFormAddressEligibleForStep2(address, placeLatLng);

  return {
    address,
    setAddress,
    description,
    setDescription,
    urgency,
    setUrgency,
    photoDataUrls,
    placeLatLng,
    setPlaceLatLng,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    scheduledDate,
    setScheduledDate,
    scheduledTime,
    setScheduledTime,
    audioTranscription,
    setAudioTranscription,
    audioBlob,
    setAudioBlob,
    demoAudioSaving,
    step,
    setStep,
    takenSlots,
    busy,
    locatingAddress,
    recapPhotosOpen,
    setRecapPhotosOpen,
    fileInputRef,
    addressInputRef,
    audioRecorder,
    fillAddressFromGeolocation,
    ingestFiles,
    removePhoto,
    handleSubmit,
    canSubmit,
    canContinueAddress,
  };
}
