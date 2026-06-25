"use client";

import React from "react";
import SmartFormRecapActionBar from "@/features/interventions/components/SmartFormRecapActionBar";
import {
  SmartFormRecapPhotosSheet,
  SmartFormRecapPhotosStrip,
} from "@/features/interventions/components/SmartFormRecapPhotosSheet";
import SmartFormRecapTiles from "@/features/interventions/components/SmartFormRecapTiles";
import InterventionPriceEstimateCard from "@/features/interventions/components/InterventionPriceEstimateCard";

type Props = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  description: string;
  audioTranscription: string;
  audioBlob: Blob | null;
  scheduledDate: string;
  scheduledTime: string;
  photoDataUrls: string[];
  urgency: boolean;
  setUrgency: (fn: (prev: boolean) => boolean) => void;
  recapPhotosOpen: boolean;
  setRecapPhotosOpen: (v: boolean) => void;
  canSubmit: boolean;
  busy: boolean;
  onSubmit: () => void;
};

export default function SmartFormStep5Recap(props: Props) {
  const {
    firstName,
    lastName,
    phone,
    address,
    description,
    audioTranscription,
    audioBlob,
    scheduledDate,
    scheduledTime,
    photoDataUrls,
    urgency,
    setUrgency,
    recapPhotosOpen,
    setRecapPhotosOpen,
    canSubmit,
    busy,
    onSubmit,
  } = props;

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      role="region"
      aria-label="Étape 5 — Récapitulatif"
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-2 pr-1">
        <div
          data-testid="smart-form-recap-panel"
          className="flex min-w-0 shrink-0 flex-col gap-2 rounded-[16px] bg-gradient-to-b from-slate-100/55 via-white/45 to-white/35 p-2 ring-1 ring-slate-900/[0.04]"
        >
          <SmartFormRecapTiles
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            address={address}
            description={description}
            audioTranscription={audioTranscription}
            audioBlob={audioBlob}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
          />
          <SmartFormRecapPhotosStrip
            photoDataUrls={photoDataUrls}
            onOpen={() => setRecapPhotosOpen(true)}
          />
          <InterventionPriceEstimateCard
            problem={description}
            transcription={audioTranscription}
            category="serrurerie"
            address={address}
            urgency={urgency}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
          />
        </div>
      </div>

      <SmartFormRecapPhotosSheet
        photoDataUrls={photoDataUrls}
        open={recapPhotosOpen}
        onClose={() => setRecapPhotosOpen(false)}
      />

      <SmartFormRecapActionBar
        urgency={urgency}
        setUrgency={setUrgency}
        canSubmit={canSubmit}
        busy={busy}
        onSubmit={onSubmit}
      />
    </div>
  );
}
