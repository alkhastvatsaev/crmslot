"use client";

import { AnimatePresence, motion } from "framer-motion";
import { auth, isConfigured } from "@/core/config/firebase";
import { cn } from "@/lib/utils";
import { useFinishJobWizard } from "@/features/interventions/hooks/useFinishJobWizard";
import FinishJobEmptyState from "@/features/interventions/components/FinishJobEmptyState";
import FinishJobPhotosStep from "@/features/interventions/components/FinishJobPhotosStep";
import FinishJobClosedStep from "@/features/interventions/components/FinishJobClosedStep";
import FinishJobWizardFooter from "@/features/interventions/components/FinishJobWizardFooter";
import TechnicianFinishInvoiceStep from "@/features/interventions/components/TechnicianFinishInvoiceStep";
import TechnicianSignaturePad from "@/features/interventions/components/TechnicianSignaturePad";
import {
  FINISH_JOB_SPRING_TRANSITION,
  FINISH_JOB_STEP_SHELL,
  FINISH_JOB_STEP_VARIANTS,
} from "@/features/interventions/finishJobWizardMotion";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function TechnicianFinishJobPanel() {
  const { t } = useTranslation();
  const wizard = useFinishJobWizard();

  if (!wizard.interventionId) {
    return <FinishJobEmptyState pager={wizard.pager} />;
  }

  if (!isConfigured || !auth) {
    return (
      <div data-testid="finish-job-offline" className="p-5 text-[13px] font-medium text-amber-900">
        {String(t("technician_hub.finish.connection_unavailable"))}
      </div>
    );
  }

  const {
    interventionId,
    liveIv,
    step,
    setStep,
    photos,
    videoRef,
    sigRef,
    captureShot,
    removePhoto,
    draftBillingLines,
    draftAiNote,
    preservedSignatureUrl,
    setPreservedSignatureUrl,
    submitBusy,
    submitAll,
    goDashboard,
    goToSignature,
    handleInvoiceSent,
    photosReady,
  } = wizard;

  return (
    <div data-testid="finish-job-panel" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === "photos" && (
            <motion.div
              key="photos"
              variants={FINISH_JOB_STEP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FINISH_JOB_SPRING_TRANSITION}
              className={FINISH_JOB_STEP_SHELL}
              data-testid="finish-job-step-photos"
            >
              <FinishJobPhotosStep
                videoRef={videoRef}
                photos={photos}
                onCapture={captureShot}
                onRemovePhoto={removePhoto}
              />
            </motion.div>
          )}

          {step === "billing" && interventionId ? (
            <motion.div
              key="billing"
              variants={FINISH_JOB_STEP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FINISH_JOB_SPRING_TRANSITION}
              className={FINISH_JOB_STEP_SHELL}
            >
              <TechnicianFinishInvoiceStep
                interventionId={interventionId}
                clientEmail={liveIv?.clientEmail}
                clientName={liveIv?.clientName}
                initialLines={draftBillingLines}
                initialAiNote={draftAiNote}
                onSent={handleInvoiceSent}
              />
            </motion.div>
          ) : null}

          {step === "closed" ? (
            <motion.div
              key="closed"
              variants={FINISH_JOB_STEP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FINISH_JOB_SPRING_TRANSITION}
              className={cn(FINISH_JOB_STEP_SHELL, "items-center justify-center")}
              data-testid="finish-job-step-closed"
            >
              <FinishJobClosedStep onDone={goDashboard} />
            </motion.div>
          ) : null}

          {step === "signature" && (
            <motion.div
              key="signature"
              variants={FINISH_JOB_STEP_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FINISH_JOB_SPRING_TRANSITION}
              className={FINISH_JOB_STEP_SHELL}
              data-testid="finish-job-step-signature"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TechnicianSignaturePad
                  ref={sigRef}
                  fillHeight
                  className="min-h-0 flex-1"
                  initialSignatureUrl={preservedSignatureUrl}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FinishJobWizardFooter
        step={step}
        photosReady={photosReady}
        submitBusy={submitBusy}
        onGoToSignature={goToSignature}
        onBackToPhotos={() => setStep("photos")}
        onClearSignature={() => {
          sigRef.current?.clear();
          setPreservedSignatureUrl(null);
        }}
        onSubmit={() => void submitAll()}
      />
    </div>
  );
}
