"use client";

import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmartForm } from "@/features/interventions/hooks/useSmartForm";
import SmartFormStep1Contact from "@/features/interventions/components/SmartFormStep1Contact";
import SmartFormStep2Description from "@/features/interventions/components/SmartFormStep2Description";
import SmartFormStep3Photos from "@/features/interventions/components/SmartFormStep3Photos";
import SmartFormStep4Schedule from "@/features/interventions/components/SmartFormStep4Schedule";
import SmartFormStep5Recap from "@/features/interventions/components/SmartFormStep5Recap";

export default function SmartInterventionRequestForm() {
  const form = useSmartForm();

  return (
    <div
      data-testid="smart-intervention-form"
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        form.step === 5 ? "gap-1 overflow-hidden" : "gap-4 pb-1"
      )}
      aria-label={`Demande d'intervention, étape ${form.step} sur 5`}
    >
      {/* Step indicator */}
      <div className="flex items-center justify-between gap-2" aria-hidden>
        <div className="flex flex-1 justify-center gap-1.5">
          {([1, 2, 3, 4, 5] as const).map((s) => (
            <span
              key={s}
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                s === form.step ? "bg-slate-900" : s < form.step ? "bg-slate-400" : "bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Back button */}
      {form.step > 1 ? (
        <button
          type="button"
          data-testid="smart-form-back"
          aria-label="Étape précédente"
          onClick={() => form.setStep((prev) => (prev > 1 ? ((prev - 1) as typeof prev) : prev))}
          className="flex w-fit items-center gap-1 rounded-[12px] px-2 py-1 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span className="sr-only">Retour</span>
        </button>
      ) : null}

      {/* Step 1 — Contact & Address */}
      {form.step === 1 ? (
        <SmartFormStep1Contact
          firstName={form.firstName}
          setFirstName={form.setFirstName}
          lastName={form.lastName}
          setLastName={form.setLastName}
          phone={form.phone}
          setPhone={form.setPhone}
          address={form.address}
          setAddress={form.setAddress}
          placeLatLng={form.placeLatLng}
          setPlaceLatLng={form.setPlaceLatLng}
          locatingAddress={form.locatingAddress}
          addressInputRef={form.addressInputRef}
          onGeolocate={() => void form.fillAddressFromGeolocation()}
          canContinueAddress={form.canContinueAddress}
          onContinue={() => form.setStep(2)}
        />
      ) : null}

      {/* Step 2 — Description & Audio */}
      {form.step === 2 ? (
        <SmartFormStep2Description
          audioBlob={form.audioBlob}
          setAudioBlob={form.setAudioBlob}
          audioTranscription={form.audioTranscription}
          setAudioTranscription={form.setAudioTranscription}
          description={form.description}
          setDescription={form.setDescription}
          demoAudioSaving={form.demoAudioSaving}
          audioRecorder={form.audioRecorder}
          onContinue={() => form.setStep(3)}
        />
      ) : null}

      {/* Step 3 — Photos */}
      {form.step === 3 ? (
        <SmartFormStep3Photos
          photoDataUrls={form.photoDataUrls}
          fileInputRef={form.fileInputRef}
          onIngestFiles={form.ingestFiles}
          onRemovePhoto={form.removePhoto}
          onContinue={() => form.setStep(4)}
        />
      ) : null}

      {/* Step 4 — Schedule */}
      {form.step === 4 ? (
        <SmartFormStep4Schedule
          scheduledDate={form.scheduledDate}
          setScheduledDate={form.setScheduledDate}
          scheduledTime={form.scheduledTime}
          setScheduledTime={form.setScheduledTime}
          takenSlots={form.takenSlots}
          onContinue={() => form.setStep(5)}
        />
      ) : null}

      {/* Step 5 — Recap & Submit */}
      {form.step === 5 ? (
        <SmartFormStep5Recap
          firstName={form.firstName}
          lastName={form.lastName}
          phone={form.phone}
          address={form.address}
          description={form.description}
          audioTranscription={form.audioTranscription}
          audioBlob={form.audioBlob}
          scheduledDate={form.scheduledDate}
          scheduledTime={form.scheduledTime}
          photoDataUrls={form.photoDataUrls}
          urgency={form.urgency}
          setUrgency={form.setUrgency}
          recapPhotosOpen={form.recapPhotosOpen}
          setRecapPhotosOpen={form.setRecapPhotosOpen}
          canSubmit={form.canSubmit}
          busy={form.busy}
          onSubmit={() => void form.handleSubmit()}
        />
      ) : null}
    </div>
  );
}
