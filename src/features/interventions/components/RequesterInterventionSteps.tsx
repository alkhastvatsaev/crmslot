"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import RequesterStepAddressSubmit from "@/features/interventions/components/RequesterStepAddressSubmit";
import RequesterStepPhotos from "@/features/interventions/components/RequesterStepPhotos";
import RequesterStepTimeSlot from "@/features/interventions/components/RequesterStepTimeSlot";
import { RequesterStepTemplates } from "@/features/interventions/components/RequesterStepTemplates";
import { RequesterStepVoice } from "@/features/interventions/components/RequesterStepVoice";
import type { useRequesterInterventionPanelController } from "@/features/interventions/hooks/useRequesterInterventionPanelController";
import {
  requesterStepLayerClass,
  requesterStepSpringTransition,
  requesterStepVariants,
} from "@/features/interventions/requesterInterventionStepMotion";

type Controller = ReturnType<typeof useRequesterInterventionPanelController>;

type Props = {
  c: Controller;
};

export default function RequesterInterventionSteps({ c }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {c.currentStep === 0 && (
        <motion.div
          key="step0"
          variants={requesterStepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={requesterStepSpringTransition}
          className={cn(requesterStepLayerClass, "flex flex-col justify-center px-8 py-3")}
        >
          <RequesterStepTemplates
            problemTemplateId={c.problemTemplateId}
            problemLabel={c.problemLabel}
            onSelect={c.handleProblemSelect}
          />
        </motion.div>
      )}

      {c.currentStep === 1 && (
        <motion.div
          key="step1"
          variants={requesterStepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={requesterStepSpringTransition}
          className={cn(
            requesterStepLayerClass,
            "flex flex-col items-center justify-center px-8 py-6"
          )}
          role="region"
          aria-labelledby="requester-step1-title"
        >
          <RequesterStepVoice
            description={c.description}
            audioBlob={c.audioBlob ?? null}
            isListening={c.descriptionVoiceListening}
            isVoiceSupported={c.descriptionVoiceSupported}
            interimTranscript={c.interimTranscript}
            onToggleVoice={c.toggleDescriptionVoice}
            onDescriptionChange={(val) =>
              c.setRequestData((prev) => ({ ...prev, description: val }))
            }
            onRemoveAudio={() => c.setRequestData((prev) => ({ ...prev, audioBlob: null }))}
          />
        </motion.div>
      )}

      {c.currentStep === 2 && (
        <motion.div
          key="step2"
          variants={requesterStepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={requesterStepSpringTransition}
          className={cn(requesterStepLayerClass, "flex flex-col gap-6 px-8 py-6")}
        >
          <RequesterStepPhotos
            fileInputRef={c.fileInputRef}
            photoDataUrls={c.photoDataUrls}
            onIngestFiles={(files) => void c.ingestFiles(files)}
            onRemovePhoto={c.removePhoto}
            onSkip={() => c.setCurrentStep(3)}
          />
        </motion.div>
      )}

      {c.currentStep === 3 && (
        <motion.div
          key="step3"
          variants={requesterStepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={requesterStepSpringTransition}
          className={cn(requesterStepLayerClass, "flex flex-col gap-6 px-8 py-4")}
        >
          <RequesterStepTimeSlot
            tenantCompanyId={c.tenantCompanyId}
            interventionDate={c.interventionDate}
            interventionTime={c.interventionTime}
            onDateSelect={(date) =>
              c.setRequestData((prev) => ({ ...prev, interventionDate: date }))
            }
            onTimeSelect={(time) => {
              c.setRequestData((prev) => ({ ...prev, interventionTime: time }));
              c.setCurrentStep(4);
            }}
          />
        </motion.div>
      )}

      {c.currentStep === 4 && (
        <motion.div
          key={c.showSubmitSuccess ? "step4-success" : "step4"}
          data-testid="requester-step4"
          variants={requesterStepVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={requesterStepSpringTransition}
          className={cn(requesterStepLayerClass, "flex min-h-0 flex-col overflow-hidden px-8 py-3")}
        >
          <RequesterStepAddressSubmit
            showSubmitSuccess={c.showSubmitSuccess}
            dossierNumber={c.lastSubmittedPortalAccessCode}
            interventionAddress={c.interventionAddress}
            interventionLatLng={c.interventionLatLng ?? null}
            locatingAddress={c.locatingAddress}
            canSubmit={Boolean(c.canSubmit)}
            isSubmitting={c.isSubmitting}
            addressConfirmed={c.addressConfirmed}
            hasValidAddress={c.hasValidAddress}
            checklistProfile={c.readiness.profile}
            checklistProblem={c.readiness.problem}
            checklistAddress={c.hasValidAddress && c.addressConfirmed}
            recapFirstName={c.profile.firstName}
            recapLastName={c.profile.lastName}
            recapPhone={c.profile.phone}
            recapProblemLabel={c.problemLabel}
            recapDescription={c.description}
            recapDate={c.interventionDate}
            recapTime={c.interventionTime}
            recapUrgency={c.requestDataUrgency}
            onAddressChange={(val) =>
              c.setRequestData((prev) => ({ ...prev, interventionAddress: val }))
            }
            onPlaceSelect={(formatted, loc) =>
              c.setRequestData((prev) => ({
                ...prev,
                interventionAddress: formatted,
                interventionLatLng: loc,
              }))
            }
            onLocate={c.fillAddressFromGeolocation}
            onConfirmAddress={() => c.setAddressConfirmed(true)}
            onFocusChecklistItem={c.focusChecklistItem}
            onSubmit={() => void c.handleSubmit()}
            onKeyDown={c.showSubmitSuccess ? undefined : c.trySubmitOnEnter}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
