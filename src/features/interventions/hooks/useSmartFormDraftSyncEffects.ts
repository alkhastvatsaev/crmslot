"use client";

import { useEffect } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firestore } from "@/core/config/firebase";
import { SMART_INTERVENTION_DRAFT_STORAGE_KEY } from "@/features/interventions/smartInterventionConstants";
import {
  emptyDraft,
  initialStepFromPayload,
  loadStorageDraft,
} from "@/features/interventions/smartFormDraftStorage";
import type { DraftPayload, WizardStep } from "@/features/interventions/smartFormTypes";
import type { DraftFieldSetters } from "@/features/interventions/hooks/smartFormDraftEffectsTypes";

export function useSmartFormDraftRemoteLoad(
  setters: Pick<
    DraftFieldSetters,
    | "setAddress"
    | "setUrgency"
    | "setPhotoDataUrls"
    | "setPlaceLatLng"
    | "setFirstName"
    | "setLastName"
    | "setPhone"
    | "setScheduledDate"
    | "setScheduledTime"
    | "setAudioTranscription"
    | "setStep"
  >
) {
  const {
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
  } = setters;

  useEffect(() => {
    const db = firestore;
    if (!db || !auth) return;
    let cancelled = false;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || cancelled) return;
      try {
        const snap = await getDoc(doc(db, "intervention_request_drafts", user.uid));
        if (!snap.exists() || cancelled) return;
        const data = snap.data() as { payload?: DraftPayload; updatedAt?: Timestamp };
        const remoteMs = data.updatedAt?.toMillis?.() ?? 0;
        const localMs = loadStorageDraft()?.updatedAt ?? 0;
        if (remoteMs <= localMs) return;
        const p = data.payload;
        if (!p) return;
        const merged = { ...emptyDraft(), ...p };
        setAddress(merged.address);
        setUrgency(Boolean(merged.urgency));
        setPhotoDataUrls(Array.isArray(merged.photoDataUrls) ? merged.photoDataUrls : []);
        setPlaceLatLng(merged.placeLatLng);
        setFirstName(merged.firstName ?? "");
        setLastName(merged.lastName ?? "");
        setPhone(merged.phone ?? "");
        setScheduledDate(merged.scheduledDate ?? "");
        setScheduledTime(merged.scheduledTime ?? "");
        setAudioTranscription(merged.audioTranscription ?? "");
        setStep(initialStepFromPayload(merged));
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [
    setAddress,
    setAudioTranscription,
    setFirstName,
    setLastName,
    setPhone,
    setPhotoDataUrls,
    setPlaceLatLng,
    setScheduledDate,
    setScheduledTime,
    setStep,
    setUrgency,
  ]);
}

export function useSmartFormDraftPersist(payload: DraftPayload) {
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
  } = payload;

  useEffect(() => {
    const draftPayload: DraftPayload = {
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
    };
    const updatedAt = Date.now();
    try {
      localStorage.setItem(
        SMART_INTERVENTION_DRAFT_STORAGE_KEY,
        JSON.stringify({ payload: draftPayload, updatedAt })
      );
    } catch {
      /* quota */
    }

    const timer = window.setTimeout(async () => {
      const db = firestore;
      const user = auth?.currentUser;
      if (!db || !user) return;
      try {
        await setDoc(
          doc(db, "intervention_request_drafts", user.uid),
          { payload: draftPayload, updatedAt: Timestamp.now() },
          { merge: true }
        );
      } catch {
        /* hors ligne */
      }
    }, 850);

    return () => window.clearTimeout(timer);
  }, [
    address,
    audioTranscription,
    description,
    firstName,
    lastName,
    phone,
    photoDataUrls,
    placeLatLng,
    scheduledDate,
    scheduledTime,
    urgency,
  ]);
}

export function useSmartFormDraftStepGuard(
  address: string,
  step: WizardStep,
  setStep: (v: WizardStep) => void
) {
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step > 1 && !address.trim()) setStep(1);
  }, [address, setStep, step]);
}
