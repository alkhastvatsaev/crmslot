"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { logger } from "@/core/logger";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useRequesterHub } from "../context/RequesterHubContext";
import { ImagePlus, Loader2, MapPin, SendHorizontal } from "lucide-react";
import { SmartTimeSlotPicker } from "./SmartTimeSlotPicker";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  REQUESTER_INTERVENTION_ENTER_SUBMIT_EVENT,
  SMART_FORM_TEMPLATES,
  type SmartFormTemplate,
} from "@/features/interventions/smartInterventionConstants";
import SmartFormAddressAutocomplete from "@/features/interventions/components/SmartFormAddressAutocomplete";
import SmartFormAddressMiniMap from "@/features/interventions/components/SmartFormAddressMiniMap";
import RequesterInterventionStepperHeader from "./RequesterInterventionStepperHeader";
import { useBrowserSpeechDictation } from "@/features/interventions/useBrowserSpeechDictation";
import { SMART_FORM_MAX_PHOTOS } from "@/features/interventions/hooks/useSmartForm";
import { useRequesterInterventionForm } from "@/features/interventions/hooks/useRequesterInterventionForm";
import { RequesterStepTemplates } from "./RequesterStepTemplates";
import { RequesterStepVoice } from "./RequesterStepVoice";
import RequesterSubmittedDossierBanner from "./RequesterSubmittedDossierBanner";

const stepVariants = {
  initial: { opacity: 0, x: 20, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -20, filter: "blur(4px)" },
};

const springTransition = { type: "spring", bounce: 0, duration: 0.4 } as const;

/** Calque d’étape — remplit la zone au-dessus du footer stepper (jamais en overlay). */
const stepLayerClass =
  "absolute inset-0 overflow-y-auto custom-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

export default function RequesterInterventionPanel() {
  const {
    requestData,
    setRequestData,
    currentStep,
    setCurrentStep,
    isSubmitting,
    validationFailedCount,
    lastSubmittedPortalAccessCode,
    setLastSubmittedPortalAccessCode,
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
  } = requestData;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep translated problem label in sync when language changes
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

  // Voice dictation
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

  const trySubmitOnEnter = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.defaultPrevented) return;
      if (currentStep !== 4 || !canSubmit || isSubmitting) return;
      e.preventDefault();
      void handleSubmit();
    },
    [currentStep, canSubmit, isSubmitting, handleSubmit]
  );

  useEffect(() => {
    if (currentStep !== 4) return;
    const onEnterSubmit = () => {
      if (!canSubmit || isSubmitting) return;
      void handleSubmit();
    };
    window.addEventListener(REQUESTER_INTERVENTION_ENTER_SUBMIT_EVENT, onEnterSubmit);
    return () =>
      window.removeEventListener(REQUESTER_INTERVENTION_ENTER_SUBMIT_EVENT, onEnterSubmit);
  }, [currentStep, canSubmit, isSubmitting, handleSubmit]);

  const handleProblemSelect = (tpl: SmartFormTemplate) => {
    setLastSubmittedPortalAccessCode(null);
    const labelText = String(t(tpl.label));
    const seedText = String(t(tpl.seed));
    setRequestData((prev) => ({
      ...prev,
      problemTemplateId: tpl.id,
      problemLabel: labelText,
      description: prev.description.trim() ? prev.description : seedText,
    }));
    setCurrentStep(1); // Auto-advance
  };

  const showSubmitSuccess = Boolean(
    lastSubmittedPortalAccessCode &&
    currentStep === 4 &&
    !isSubmitting &&
    !problemLabel.trim() &&
    !description.trim() &&
    !interventionAddress.trim()
  );

  return (
    <div
      data-testid="requester-intervention-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {/* ── Step 0: Problem template grid ─────────────────────────────── */}
          {currentStep === 0 && (
            <motion.div
              key="step0"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={cn(stepLayerClass, "flex flex-col justify-center px-8 py-3")}
            >
              <RequesterStepTemplates
                problemTemplateId={problemTemplateId}
                problemLabel={problemLabel}
                onSelect={handleProblemSelect}
              />
            </motion.div>
          )}

          {/* ── Step 1: Voice / description ───────────────────────────────── */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={cn(stepLayerClass, "flex flex-col items-center justify-center px-8 py-6")}
              role="region"
              aria-labelledby="requester-step1-title"
            >
              <RequesterStepVoice
                description={description}
                audioBlob={audioBlob ?? null}
                isListening={descriptionVoiceListening}
                isVoiceSupported={descriptionVoiceSupported}
                interimTranscript={interimTranscript}
                onToggleVoice={toggleDescriptionVoice}
                onDescriptionChange={(val) =>
                  setRequestData((prev) => ({ ...prev, description: val }))
                }
                onRemoveAudio={() => setRequestData((prev) => ({ ...prev, audioBlob: null }))}
              />
            </motion.div>
          )}

          {/* ── Step 2: Photos ────────────────────────────────────────────── */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={cn(stepLayerClass, "flex flex-col gap-6 px-8 py-6")}
            >
              <div className="flex flex-col gap-4 mt-1">
                <h2 className="text-center text-xl font-bold text-slate-800">
                  {String(t("requester.intervention.photos_heading"))}
                </h2>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      void ingestFiles(e.target.files);
                    }
                    e.target.value = "";
                  }}
                />
                <div className="grid grid-cols-2 gap-6">
                  {Array.from({ length: SMART_FORM_MAX_PHOTOS }, (_, i) => {
                    const src = photoDataUrls[i];
                    const filled = Boolean(src);
                    const isNextSlot = !filled && i === photoDataUrls.length;

                    return (
                      <div key={i} className="aspect-square relative group">
                        {filled ? (
                          <div className="relative h-full w-full overflow-hidden rounded-[24px] shadow-sm border border-black/5">
                            <Image
                              src={src}
                              alt=""
                              width={400}
                              height={400}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              aria-label={String(t("smart_form.step3.removePhotoAria")).replace(
                                "{n}",
                                String(i + 1)
                              )}
                              className="absolute right-2 top-2 rounded-full bg-white/90 backdrop-blur-md p-2.5 text-black shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white transition-all duration-300 transform scale-90 group-hover:scale-100"
                            >
                              <ImagePlus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : isNextSlot ? (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                              "flex h-full w-full flex-col gap-2 items-center justify-center rounded-[24px] transition-all duration-300 active:scale-[0.98]",
                              i === 0 && validationFailedCount > 0
                                ? "bg-red-50/50 border-2 border-dashed border-red-300 hover:bg-red-50 hover:border-red-400 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            )}
                          >
                            <div className="rounded-full bg-white shadow-sm p-3 transition-transform duration-300 group-hover:scale-105">
                              <ImagePlus
                                className={cn(
                                  "h-6 w-6",
                                  i === 0 && validationFailedCount > 0
                                    ? "text-red-500"
                                    : "text-slate-800"
                                )}
                              />
                            </div>
                            <span className="text-base font-bold tracking-tight">
                              {i === 0 && validationFailedCount > 0
                                ? String(t("requester.intervention.photo_required"))
                                : String(t("requester.intervention.photo_add"))}
                            </span>
                          </button>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-slate-50 border border-black/5">
                            <ImagePlus className="h-6 w-6 text-slate-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Time slot ─────────────────────────────────────────── */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={cn(stepLayerClass, "flex flex-col gap-6 px-8 py-4")}
            >
              <div className="flex flex-col gap-6">
                <h2 className="text-center text-xl font-bold text-slate-800 px-2">
                  {String(t("smart_form.step4.title"))}
                </h2>
                <SmartTimeSlotPicker
                  companyId={tenantCompanyId}
                  selectedDate={interventionDate || ""}
                  selectedTime={interventionTime || ""}
                  onDateSelect={(date) =>
                    setRequestData((prev) => ({ ...prev, interventionDate: date }))
                  }
                  onTimeSelect={(time) => {
                    setRequestData((prev) => ({ ...prev, interventionTime: time }));
                    setCurrentStep(4);
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Address + submit ──────────────────────────────────── */}
          {currentStep === 4 && (
            <motion.div
              key={showSubmitSuccess ? "step4-success" : "step4"}
              data-testid="requester-step4"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={cn(stepLayerClass, "flex min-h-0 flex-col overflow-hidden px-8 py-3")}
              onKeyDown={showSubmitSuccess ? undefined : trySubmitOnEnter}
            >
              {showSubmitSuccess ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-2">
                  <RequesterSubmittedDossierBanner dossierNumber={lastSubmittedPortalAccessCode!} />
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex min-h-0 flex-1 flex-col gap-1 rounded-[24px] border border-black/5 bg-white p-3 shadow-sm">
                    <div className="flex shrink-0 items-center gap-2">
                      <div className="relative flex-1">
                        <SmartFormAddressAutocomplete
                          value={interventionAddress}
                          onValueChange={(val) =>
                            setRequestData((prev) => ({ ...prev, interventionAddress: val }))
                          }
                          onPlaceSelect={(formatted, loc) =>
                            setRequestData((prev) => ({
                              ...prev,
                              interventionAddress: formatted,
                              interventionLatLng: loc,
                            }))
                          }
                          disabled={locatingAddress}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={fillAddressFromGeolocation}
                        disabled={locatingAddress}
                        aria-label={String(t("requester.intervention.locate_aria"))}
                        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px] bg-slate-100 transition-colors hover:bg-slate-200 disabled:opacity-50"
                      >
                        {locatingAddress ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : (
                          <MapPin className="h-4 w-4 text-slate-800" />
                        )}
                      </button>
                    </div>

                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-[16px]">
                      <SmartFormAddressMiniMap
                        address={interventionAddress}
                        placeLatLng={interventionLatLng}
                        className="h-full min-h-[140px] w-full !border-none"
                      />
                      <div className="pointer-events-none absolute inset-0 rounded-[16px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]" />
                    </div>
                  </div>

                  <div className="shrink-0 pb-1">
                    <button
                      type="button"
                      data-testid="intervention-submit-btn"
                      disabled={!canSubmit}
                      onClick={handleSubmit}
                      className="mx-auto flex w-fit min-w-[280px] items-center justify-center gap-2 rounded-[16px] bg-black px-8 py-4 text-lg font-bold text-white transition hover:bg-slate-900 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <SendHorizontal className="h-5 w-5" />
                          {String(t("requester.intervention.submit_request"))}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <footer className="shrink-0 px-8 pb-4 pt-1" data-testid="requester-intervention-stepper">
        <RequesterInterventionStepperHeader />
      </footer>
    </div>
  );
}
