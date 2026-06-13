"use client";

import { logger } from "@/core/logger";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardList,
  Loader2,
  MoreHorizontal,
  Package,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Intervention } from "@/features/interventions/types";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { HUB_FONT_OUTFIT, HubButton } from "@/core/ui/hub";
import { auth, isConfigured } from "@/core/config/firebase";
import { useOfflineSyncOptional } from "@/context/OfflineSyncContext";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { cn } from "@/lib/utils";
import { capturePhotoFromVideo } from "@/features/interventions/finishJobCapture";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import {
  FINISH_JOB_MAX_PHOTOS,
  FINISH_JOB_MIN_PHOTOS,
} from "@/features/interventions/finishJobConstants";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import { finalizeCompletionOfflineAware } from "@/features/interventions/completionUpload";
import TechnicianSignaturePad, {
  type TechnicianSignaturePadHandle,
} from "@/features/interventions/components/TechnicianSignaturePad";
import { useTechnicianBackofficeReportBridgeOptional } from "@/context/TechnicianBackofficeReportBridgeContext";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { useTranslation } from "@/core/i18n/I18nContext";
import FinishJobStepIndicator, {
  type FinishJobStep,
} from "@/features/interventions/components/FinishJobStepIndicator";
import TechnicianFinishInvoiceStep from "@/features/interventions/components/TechnicianFinishInvoiceStep";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import { finishWizardPhotosFromIntervention } from "@/features/interventions/technicianCompletionReport";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { useQueryClient } from "@tanstack/react-query";

const stepVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};
const springTransition = { type: "spring", bounce: 0, duration: 0.35 } as const;

const CATEGORY_ICONS = {
  panne: AlertTriangle,
  materiel: Package,
  preuve: CheckCircle2,
  autre: MoreHorizontal,
} as const;

type PhotoCategory = "panne" | "materiel" | "preuve" | "autre";

const STEP_SHELL = "absolute inset-0 flex min-h-0 flex-col overflow-hidden px-3";

export default function TechnicianFinishJobPanel() {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const queryClient = useQueryClient();
  const { finishJobInterventionId, finishJobEntryStep, setFinishJobInterventionId } =
    useTechnicianFinishJob();
  const offlineSync = useOfflineSyncOptional();
  const backofficeBridge = useTechnicianBackofficeReportBridgeOptional();

  const [step, setStep] = useState<FinishJobStep>("photos");
  const [draftBillingLines, setDraftBillingLines] = useState<DraftBillingLine[]>([]);
  const [draftAiNote, setDraftAiNote] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ url: string; category: PhotoCategory }[]>([]);
  const [currentCategory, setCurrentCategory] = useState<PhotoCategory>("preuve");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sigRef = useRef<TechnicianSignaturePadHandle>(null);

  const [submitBusy, setSubmitBusy] = useState(false);
  const submitInFlightRef = useRef(false);
  const hydratedReportRef = useRef<string | null>(null);

  const interventionId = finishJobInterventionId;
  const liveIv = useInterventionLive(interventionId);
  const isAmendMode = liveIv?.status === "done";
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
  }, []);

  useEffect(() => {
    if (!interventionId || step !== "photos") {
      stopCamera();
      return () => {};
    }

    let cancelled = false;
    void navigator.mediaDevices
      ?.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) {
          el.srcObject = stream;
          void el.play().catch(() => {});
        }
      })
      .catch(() => {
        toast.error(String(t("technician_hub.finish.toasts.camera_unavailable")), {
          description: String(t("technician_hub.finish.toasts.camera_unavailable_desc")),
        });
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [interventionId, step, stopCamera, t]);

  const captureShot = () => {
    const v = videoRef.current;
    if (!v || photos.length >= FINISH_JOB_MAX_PHOTOS) return;
    try {
      const url = capturePhotoFromVideo(v);
      setPhotos((p) => [...p, { url, category: currentCategory }]);
    } catch {
      toast.error(String(t("technician_hub.finish.toasts.photo_impossible")));
    }
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  };

  const resetWizard = () => {
    stopCamera();
    setPhotos([]);
    sigRef.current?.clear();
    setStep("photos");
    setDraftBillingLines([]);
    setDraftAiNote(null);
    hydratedReportRef.current = null;
  };

  const prefetchDraftBilling = useCallback(async (ivId: string) => {
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(ivId)}/prepare-draft-billing`,
        { method: "POST" }
      );
      const data = (await res.json()) as {
        ok?: boolean;
        billingLines?: DraftBillingLine[];
        aiNote?: string;
      };
      if (res.ok && data.ok && Array.isArray(data.billingLines)) {
        setDraftBillingLines(data.billingLines);
        if (typeof data.aiNote === "string") setDraftAiNote(data.aiNote);
      }
    } catch (err) {
      logger.warn("[prefetch-draft-billing]", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  useEffect(() => {
    resetWizard();
    if (finishJobEntryStep === "invoice" && interventionId) {
      setStep("billing");
      void prefetchDraftBilling(interventionId);
    }
  }, [interventionId, finishJobEntryStep, prefetchDraftBilling]);

  useEffect(() => {
    if (!interventionId || isAmendMode) return;
    void prefetchDraftBilling(interventionId);
  }, [interventionId, isAmendMode, prefetchDraftBilling]);

  useEffect(() => {
    if (!liveIv || liveIv.status !== "done" || hydratedReportRef.current === liveIv.id) return;
    hydratedReportRef.current = liveIv.id;
    const existingPhotos = finishWizardPhotosFromIntervention(liveIv);
    if (existingPhotos.length > 0) {
      setPhotos(existingPhotos);
    }
  }, [liveIv]);

  const goDashboard = () => {
    setFinishJobInterventionId(null);
    resetWizard();
    navigateTechnicianHub(pager ?? undefined, TECHNICIAN_HUB_ANCHOR_MISSIONS);
  };

  const goToSignature = () => {
    stopCamera();
    setStep("signature");
  };

  const submitAll = async () => {
    if (submitInFlightRef.current) return;
    if (!interventionId || !auth?.currentUser) {
      toast.error(String(t("technician_hub.finish.toasts.login_required")));
      return;
    }
    const sig = sigRef.current?.getPngDataUrl();
    if (!sig) {
      toast.error(String(t("technician_hub.finish.toasts.signature_missing")));
      return;
    }

    submitInFlightRef.current = true;
    setSubmitBusy(true);

    try {
      const photoDataUrls = photos.map((p) => p.url);
      const signaturePngDataUrl = sig;

      backofficeBridge?.pushReport({
        interventionId,
        photoDataUrls,
        signaturePngDataUrl,
      });

      if (liveIv) {
        const actorUid = auth?.currentUser?.uid?.trim() || "system";
        await logCrmInterventionAction({
          kind: "intervention_terrain_report_received",
          iv: liveIv,
          actorUid,
          actorRole: "technician",
          note: isAmendMode
            ? `Rapport terrain modifié (${photoDataUrls.length} photo(s))`
            : `Rapport terrain (${photoDataUrls.length} photo(s))`,
        });
      }

      stopCamera();

      const result = await finalizeCompletionOfflineAware({
        interventionId,
        photoDataUrls,
        signaturePngDataUrl,
      });
      if (result.outcome === "error") {
        toast.error(String(t("technician_hub.finish.toasts.server_save_title")), {
          description: result.message,
        });
        return;
      }
      if (result.outcome === "queued") {
        toast.message(String(t("technician_hub.finish.toasts.offline_queue")), {
          description: String(t("technician_hub.finish.toasts.offline_queue_desc")),
        });
        void offlineSync?.flushNow?.();
      }
      void offlineSync?.refreshPendingCount();

      const technicianUid = auth?.currentUser?.uid?.trim() || "";
      if (isAmendMode && technicianUid) {
        patchTechnicianAssignmentInCache(queryClient, technicianUid, interventionId, {
          status: "done",
        });
      }

      if (isAmendMode) {
        toast.success(String(t("technician_hub.finish.toasts.report_updated")), {
          description: String(t("technician_hub.finish.toasts.report_updated_desc")),
        });
        await prefetchDraftBilling(interventionId);
        setStep("billing");
        return;
      }

      await prefetchDraftBilling(interventionId);

      toast.success(String(t("technician_hub.finish.toasts.report_sent")), {
        description: String(t("technician_hub.finish.toasts.report_sent_desc")),
      });
      if (PRESENTATION_PRIVACY_MODE) {
        toast.message(String(t("technician_hub.finish.toasts.presentation_mode")), {
          description: String(t("technician_hub.finish.toasts.presentation_mode_desc")),
        });
      }

      setStep("billing");
    } catch (e) {
      logger.error(e instanceof Error ? e.message : String(e));
      setStep("signature");
      toast.error(String(t("technician_hub.finish.toasts.send_failed")), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      submitInFlightRef.current = false;
      setSubmitBusy(false);
    }
  };

  const firebaseUnavailable = !isConfigured || !auth;
  const photosReady = photos.length >= FINISH_JOB_MIN_PHOTOS;

  if (!interventionId) {
    return (
      <div data-testid="finish-job-empty" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-[260px] flex-col items-center justify-center gap-5 text-center`}
        >
          <p className="sr-only">{String(t("technician_hub.finish.no_mission"))}</p>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/80 shadow-inner">
            <ClipboardList className="h-8 w-8 text-slate-400" aria-hidden />
          </div>
          <p className="max-w-[200px] text-[14px] font-medium leading-relaxed text-slate-500">
            {String(t("technician_hub.finish.select_to_close"))}
          </p>
          <HubButton
            type="button"
            data-testid="finish-job-back-empty"
            onClick={() => navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_MISSIONS)}
            aria-label={String(t("technician_hub.finish.open_mission_list"))}
            className="mt-2"
          >
            {String(t("technician_hub.finish.see_missions"))}
          </HubButton>
        </div>
      </div>
    );
  }

  if (firebaseUnavailable) {
    return (
      <div data-testid="finish-job-offline" className="p-5 text-[13px] font-medium text-amber-900">
        {String(t("technician_hub.finish.connection_unavailable"))}
      </div>
    );
  }

  return (
    <div data-testid="finish-job-panel" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-end px-3 py-1">
        <button
          type="button"
          onClick={goDashboard}
          aria-label={String(t("technician_hub.finish.cancel_close"))}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === "photos" && (
            <motion.div
              key="photos"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={STEP_SHELL}
              data-testid="finish-job-step-photos"
            >
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-slate-950 shadow-lg ring-1 ring-black/10">
                <video
                  ref={videoRef}
                  className={cn(
                    "h-full w-full object-cover",
                    PRESENTATION_PRIVACY_MODE ? "blur-2xl" : null
                  )}
                  muted
                  playsInline
                  autoPlay
                  aria-label={String(t("technician_hub.finish.camera_done"))}
                />
                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />

                <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center">
                  <button
                    type="button"
                    data-testid="finish-job-capture-btn"
                    disabled={photos.length >= FINISH_JOB_MAX_PHOTOS}
                    onClick={captureShot}
                    aria-label={String(t("technician_hub.finish.capture_photo"))}
                    className="flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-white/90 bg-white/95 shadow-lg transition active:scale-95 disabled:opacity-40"
                  >
                    <div className="h-9 w-9 rounded-full bg-slate-900" />
                  </button>
                </div>

                <div className="absolute left-2 right-2 top-2 z-20 flex justify-center gap-2 rounded-full bg-black/45 p-1 backdrop-blur-sm">
                  {(["panne", "materiel", "preuve", "autre"] as const).map((cat) => {
                    const IconComponent = CATEGORY_ICONS[cat];
                    const isActive = currentCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCurrentCategory(cat)}
                        aria-label={cat}
                        aria-pressed={isActive}
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full transition",
                          isActive ? "bg-white text-slate-900" : "text-white/80"
                        )}
                      >
                        <IconComponent className="h-4 w-4" strokeWidth={2.25} />
                      </button>
                    );
                  })}
                </div>

                {PRESENTATION_PRIVACY_MODE ? (
                  <div className="absolute right-2 top-14 rounded-full bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    {String(t("technician_hub.finish.presentation_mode"))}
                  </div>
                ) : null}
              </div>

              <div
                data-testid="finish-job-photo-strip"
                className="mt-2 flex h-14 shrink-0 items-center gap-2 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {photos.map((photo, i) => (
                  <div
                    key={`${i}-${photo.url.slice(0, 24)}`}
                    className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt=""
                      className={cn(
                        "h-full w-full object-cover",
                        PRESENTATION_PRIVACY_MODE ? "blur-lg" : null
                      )}
                    />
                    <button
                      type="button"
                      data-testid={`finish-job-photo-remove-${i}`}
                      aria-label={String(t("technician_hub.finish.delete_photo"))}
                      onClick={() => removePhoto(i)}
                      className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white"
                    >
                      <Trash2 className="h-2.5 w-2.5" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === "billing" && interventionId ? (
            <motion.div
              key="billing"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={STEP_SHELL}
            >
              <TechnicianFinishInvoiceStep
                interventionId={interventionId}
                clientEmail={liveIv?.clientEmail}
                clientName={liveIv?.clientName}
                initialLines={draftBillingLines}
                initialAiNote={draftAiNote}
                onSent={() => {
                  resetWizard();
                  setFinishJobInterventionId(null);
                  navigateTechnicianHub(pager ?? undefined, TECHNICIAN_HUB_ANCHOR_MISSIONS);
                }}
                onSkip={() => {
                  resetWizard();
                  setFinishJobInterventionId(null);
                  navigateTechnicianHub(pager ?? undefined, TECHNICIAN_HUB_ANCHOR_MISSIONS);
                }}
              />
            </motion.div>
          ) : null}

          {step === "signature" && (
            <motion.div
              key="signature"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={springTransition}
              className={STEP_SHELL}
              data-testid="finish-job-step-signature"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <TechnicianSignaturePad ref={sigRef} fillHeight className="min-h-0 flex-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="shrink-0 border-t border-slate-100 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {step === "photos" ? (
          <div className="mb-2 flex items-center justify-between gap-3">
            <span
              className="text-[11px] font-semibold tabular-nums text-slate-500"
              aria-live="polite"
            >
              {photos.length}/{FINISH_JOB_MAX_PHOTOS}
              {!photosReady ? (
                <span className="text-slate-400"> · min {FINISH_JOB_MIN_PHOTOS}</span>
              ) : null}
            </span>
            <button
              type="button"
              data-testid="finish-job-continue-photos"
              disabled={!photosReady}
              onClick={goToSignature}
              aria-label={String(t("technician_hub.finish.continue_signature"))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition active:scale-95 disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        ) : null}

        {step === "billing" ? null : step === "signature" ? (
          <div className="mb-2 flex items-center justify-center gap-3">
            <button
              type="button"
              data-testid="finish-job-back-photos"
              onClick={() => setStep("photos")}
              aria-label={String(t("technician_hub.finish.back_photos"))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              data-testid="finish-job-clear-signature"
              onClick={() => sigRef.current?.clear()}
              aria-label={String(t("technician_hub.finish.clear_signature"))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-rose-600 transition active:scale-95"
            >
              <RotateCcw className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              data-testid="finish-job-submit"
              disabled={submitBusy}
              onClick={() => void submitAll()}
              aria-label={String(t("technician_hub.finish.send_closure"))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md transition active:scale-95 disabled:opacity-60"
            >
              {submitBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-6 w-6 stroke-[3]" aria-hidden />
              )}
            </button>
          </div>
        ) : null}

        <FinishJobStepIndicator current={step} compact />
      </footer>
    </div>
  );
}
