"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  extractClientNameFromText,
  extractDateTimeFromText,
} from "@/features/map/components/transcriptionFormInference";
import {
  EMPTY_MAP_TRANSCRIPTION_FORM,
  isMapTranscriptionFormValid,
  type MapTranscriptionCreatedMission,
  type MapTranscriptionFormState,
} from "@/features/map/mapTranscriptionActionsTypes";
import { useMapTranscriptionActionsCreate } from "@/features/map/hooks/useMapTranscriptionActionsCreate";
import { useMapTranscriptionActionsPoll } from "@/features/map/hooks/useMapTranscriptionActionsPoll";
import { useMapTranscriptionActionsRailRect } from "@/features/map/hooks/useMapTranscriptionActionsRailRect";

export type MapTranscriptionActionsControllerOptions = {
  armed: boolean;
  onInterventionCreated?: (mission: MapTranscriptionCreatedMission) => void;
  /** Incrémenté à chaque appui sur Play pour ouvrir automatiquement le formulaire */
  openEditSignal?: number;
  /** Si défini : poller `/api/ai/audio-for-url` pour ce clip uniquement (aligné sur la file Galaxy). */
  scopedClipPublicUrl?: string | null;
  /** Refus ou intervention créée — masquer le dock Galaxy mobile. */
  onVoiceReviewComplete?: () => void;
};

export function useMapTranscriptionActionsController({
  armed,
  onInterventionCreated,
  openEditSignal = 0,
  scopedClipPublicUrl,
  onVoiceReviewComplete,
}: MapTranscriptionActionsControllerOptions) {
  const [busy, setBusy] = useState<null | "refuse" | "create">(null);
  const [editOpen, setEditOpen] = useState(false);
  /** Évite de rappeler openEdit() à chaque poll /latest-audio (sinon le formulaire efface la saisie). */
  const lastHandledOpenSignalRef = useRef(0);
  const [form, setForm] = useState<MapTranscriptionFormState>(EMPTY_MAP_TRANSCRIPTION_FORM);

  const { latest, setLatest } = useMapTranscriptionActionsPoll({ armed, scopedClipPublicUrl });
  const railScreenRect = useMapTranscriptionActionsRailRect(editOpen);

  useEffect(() => {
    if (!armed) {
      setBusy(null);
      lastHandledOpenSignalRef.current = 0;
    }
  }, [armed]);

  const canShow =
    Boolean(armed) &&
    Boolean(latest?.audio?.transcript?.trim()) &&
    (latest?.decision?.status ?? "none") === "none";

  const fileName = latest?.audio?.name ?? null;

  const openEdit = useCallback(() => {
    const meta = latest?.audio?.meta;
    const analysis = meta?.analysis;
    const sourceText = analysis?.transcription || meta?.rawTranscript || "";
    const inferredName = extractClientNameFromText(sourceText);
    const inferred = extractDateTimeFromText(sourceText, meta?.receivedAt);
    setForm({
      address: analysis?.adresse?.trim() || "",
      clientName: inferredName,
      phone: typeof meta?.phone === "string" ? meta.phone : "",
      problem: analysis?.probleme?.trim() || "",
      urgency: Boolean(analysis?.urgence),
      date: inferred.date || "",
      time: inferred.time || "",
    });
    setEditOpen(true);
  }, [latest?.audio?.meta]);

  useEffect(() => {
    if (!armed) return;
    if (!openEditSignal || openEditSignal <= lastHandledOpenSignalRef.current) return;
    if (!canShow) return;
    lastHandledOpenSignalRef.current = openEditSignal;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    openEdit();
  }, [armed, openEditSignal, canShow, openEdit]);

  const isValid = isMapTranscriptionFormValid(form);

  const { supprimer, create } = useMapTranscriptionActionsCreate({
    fileName,
    form,
    latest,
    setLatest,
    setEditOpen,
    setBusy,
    onInterventionCreated,
    onVoiceReviewComplete,
  });

  return {
    canShow,
    editOpen,
    railScreenRect,
    form,
    setForm,
    busy,
    isValid,
    supprimer,
    create,
  };
}
