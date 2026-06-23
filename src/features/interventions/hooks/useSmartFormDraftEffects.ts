"use client";

import type { DraftEffectsArgs } from "@/features/interventions/hooks/smartFormDraftEffectsTypes";
import {
  useSmartFormDraftAudioRecorderSync,
  useSmartFormDraftDemoAudioSave,
} from "@/features/interventions/hooks/useSmartFormDraftAudioEffects";
import { useSmartFormDraftPrefill } from "@/features/interventions/hooks/useSmartFormDraftPrefill";
import { useSmartFormDraftPregenerateId } from "@/features/interventions/hooks/useSmartFormDraftPregenerateId";
import { useSmartFormDraftRecapPhotosEffects } from "@/features/interventions/hooks/useSmartFormDraftRecapEffects";
import {
  useSmartFormDraftPersist,
  useSmartFormDraftRemoteLoad,
  useSmartFormDraftStepGuard,
} from "@/features/interventions/hooks/useSmartFormDraftSyncEffects";
import { useSmartFormDraftTakenSlots } from "@/features/interventions/hooks/useSmartFormDraftTakenSlots";

export function useSmartFormDraftEffects(args: DraftEffectsArgs) {
  const {
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
    audioRecorderBlob,
    audioRecorderTranscription,
    setAudioBlob,
  } = args;

  useSmartFormDraftPregenerateId(pregeneratedDocId, setPregeneratedDocId);
  useSmartFormDraftPrefill(setFirstName, setLastName, setPhone, setParentInterventionId);
  useSmartFormDraftAudioRecorderSync(
    audioRecorderBlob,
    audioRecorderTranscription,
    setAudioBlob,
    setAudioTranscription
  );
  useSmartFormDraftDemoAudioSave(audioBlob, setDemoAudioSaving, setDemoAudioUrl);
  useSmartFormDraftRecapPhotosEffects(step, recapPhotosOpen, setRecapPhotosOpen);
  useSmartFormDraftRemoteLoad({
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
  });
  useSmartFormDraftPersist({
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
  });
  useSmartFormDraftStepGuard(address, step, setStep);
  useSmartFormDraftTakenSlots(step, interventionCompanyId, setTakenSlots);
}
