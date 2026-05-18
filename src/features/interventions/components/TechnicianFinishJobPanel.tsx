"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  Loader2,
  MoreHorizontal,
  Package,
  RotateCcw,
  SendHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, serverTimestamp } from "firebase/firestore";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { technicianTransitionActor } from "@/features/interventions/workflow/workflowActor";
import type { Intervention } from "@/features/interventions/types";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { auth, firestore, isConfigured } from "@/core/config/firebase";
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
import { useTranslation } from "@/core/i18n/I18nContext";
import TechnicianBillingLinesForm, { type BillingLine } from "@/features/interventions/components/TechnicianBillingLinesForm";
import FinishJobStepIndicator from "@/features/interventions/components/FinishJobStepIndicator";
import CategoryFinishChecklist from "@/features/interventions/components/CategoryFinishChecklist";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

const CATEGORY_ICONS = {
  panne: AlertTriangle,
  materiel: Package,
  preuve: CheckCircle2,
  autre: MoreHorizontal,
} as const;

type WizardStep = "photos" | "billing" | "signature";

export default function TechnicianFinishJobPanel() {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const { finishJobInterventionId, setFinishJobInterventionId } = useTechnicianFinishJob();
  const offlineSync = useOfflineSyncOptional();
  const backofficeBridge = useTechnicianBackofficeReportBridgeOptional();

  const [step, setStep] = useState<WizardStep>("photos");
  const [photos, setPhotos] = useState<{url: string; category: 'panne' | 'materiel' | 'preuve' | 'autre'}[]>([]);
  const [currentCategory, setCurrentCategory] = useState<'panne' | 'materiel' | 'preuve' | 'autre'>('preuve');
  const [billingLines, setBillingLines] = useState<BillingLine[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sigRef = useRef<TechnicianSignaturePadHandle>(null);

  const [submitBusy, setSubmitBusy] = useState(false);
  const [checklistComplete, setChecklistComplete] = useState(true);

  const submitInFlightRef = useRef(false);

  const interventionId = finishJobInterventionId;
  const liveIv = useInterventionLive(interventionId);
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
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
          stream.getTracks().forEach((t) => t.stop());
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
      setPhotos((p) => [...p, {url, category: currentCategory}]);
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
    setBillingLines([]);
    sigRef.current?.clear();
    setStep("photos");
  };

  const goDashboard = () => {
    setFinishJobInterventionId(null);
    resetWizard();
    navigateTechnicianHub(pager ?? undefined, TECHNICIAN_HUB_ANCHOR_MISSIONS);
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
      // Legacy compatibility: bridge expects array of strings, we'll map the URLs for now
      const photoDataUrls = photos.map(p => p.url);
      const signaturePngDataUrl = sig;

      backofficeBridge?.pushReport({
        interventionId,
        photoDataUrls,
        signaturePngDataUrl,
        billingLines: billingLines.length > 0 ? billingLines : undefined,
      });

      stopCamera();

      if (PRESENTATION_PRIVACY_MODE) {
        if (firestore && auth.currentUser) {
          const snap = await getDoc(doc(firestore, "interventions", interventionId));
          const data = snap.data() as Intervention | undefined;
          await transitionInterventionStatus({
            db: firestore,
            interventionId,
            iv: {
              status: data?.status ?? "in_progress",
              assignedTechnicianUid: data?.assignedTechnicianUid ?? auth.currentUser.uid,
              createdByUid: data?.createdByUid ?? null,
              companyId: data?.companyId ?? null,
            },
            toStatus: "done",
            actor: technicianTransitionActor(auth.currentUser.uid),
            extraPatch: {
              completedAt: serverTimestamp(),
              completedByUid: auth.currentUser.uid,
              billingLines: billingLines.length > 0 ? billingLines : undefined,
            },
          });
        }
      } else {
        const result = await finalizeCompletionOfflineAware({
          interventionId,
          photoDataUrls,
          signaturePngDataUrl,
          billingLines: billingLines.length > 0 ? billingLines : undefined,
        });
        if (result.outcome === "error") {
          toast.error(String(t("technician_hub.finish.toasts.server_save_title")), { description: result.message });
          return;
        }
        if (result.outcome === "queued") {
          toast.message(String(t("technician_hub.finish.toasts.offline_queue")), {
            description: String(t("technician_hub.finish.toasts.offline_queue_desc")),
          });
          void offlineSync?.flushNow?.();
        }
        void offlineSync?.refreshPendingCount();
      }

      toast.success(String(t("technician_hub.finish.toasts.report_sent")), {
        description: String(t("technician_hub.finish.toasts.report_sent_desc")),
      });
      if (PRESENTATION_PRIVACY_MODE) {
        toast.message(String(t("technician_hub.finish.toasts.presentation_mode")), {
          description: String(t("technician_hub.finish.toasts.presentation_mode_desc")),
        });
      }

      resetWizard();
      setFinishJobInterventionId(null);
      navigateTechnicianHub(pager ?? undefined, TECHNICIAN_HUB_ANCHOR_MISSIONS);
    } catch (e) {
      console.error(e);
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

  if (!interventionId) {
    return (
      <div data-testid="finish-job-empty" style={outfit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex min-h-[260px] flex-col items-center justify-center gap-5 text-center`}>
          <p className="sr-only">
            {String(t("technician_hub.finish.no_mission"))}
          </p>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100/80 shadow-inner">
            <ClipboardList className="h-8 w-8 text-slate-400" aria-hidden />
          </div>
          <p className="max-w-[200px] text-[14px] font-medium leading-relaxed text-slate-500">
            {String(t("technician_hub.finish.select_to_close"))}
          </p>
          <button
            type="button"
            data-testid="finish-job-back-empty"
            onClick={() => navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_MISSIONS)}
            aria-label={String(t("technician_hub.finish.open_mission_list"))}
            className="mt-2 flex min-h-[48px] items-center justify-center rounded-[16px] bg-slate-900 px-6 text-[14px] font-bold text-white shadow-lg transition hover:bg-slate-800"
          >
            {String(t("technician_hub.finish.see_missions"))}
          </button>
        </div>
      </div>
    );
  }

  if (firebaseUnavailable) {
    return (
      <div data-testid="finish-job-offline" style={outfit} className="p-5 text-[13px] font-medium text-amber-900">
        {String(t("technician_hub.finish.connection_unavailable"))}
      </div>
    );
  }

  return (
    <div data-testid="finish-job-panel" style={outfit} className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className={`${GLASS_PANEL_BODY_SCROLL_COMPACT} flex flex-col gap-5 p-6`}>
        <div className="flex flex-col gap-3 pb-2">
          <FinishJobStepIndicator current={step} />
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={goDashboard}
              aria-label={String(t("technician_hub.finish.cancel_close"))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-800 active:scale-[0.95]"
            >
              <X className="h-5 w-5 stroke-[2.5]" aria-hidden />
            </button>
          </div>
        </div>

        {step === "photos" ? (
          <>


            <div className="relative mt-2 overflow-hidden rounded-[28px] bg-slate-950 shadow-2xl ring-1 ring-black/10">
              <video
                ref={videoRef}
                className={cn(
                  "aspect-[4/3] w-full object-cover opacity-95 transition-opacity duration-300",
                  PRESENTATION_PRIVACY_MODE ? "blur-2xl" : null,
                )}
                muted
                playsInline
                autoPlay
                aria-label={String(t("technician_hub.finish.camera_done"))}
              />
              <div className="absolute inset-0 pointer-events-none rounded-[28px] ring-1 ring-inset ring-white/10" />
              
              {/* Shutter overlay button */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center z-25">
                <button
                  type="button"
                  data-testid="finish-job-capture-btn"
                  disabled={photos.length >= FINISH_JOB_MAX_PHOTOS}
                  onClick={captureShot}
                  aria-label={String(t("technician_hub.finish.capture_photo"))}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white border-[4px] border-slate-950/80 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-all hover:scale-105 active:scale-90 disabled:opacity-40 disabled:hover:scale-100"
                >
                  <div className="h-10 w-10 rounded-full bg-slate-900 active:bg-slate-800 transition-colors" />
                </button>
              </div>

              {PRESENTATION_PRIVACY_MODE ? (
                <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-md">
                  {String(t("technician_hub.finish.presentation_mode"))}
                </div>
              ) : null}
            </div>

            {/* Minimalist category selectors */}
            <div className="mt-4 flex justify-center items-center gap-4 bg-slate-50 rounded-[20px] p-2.5 border border-slate-100">
              {(['panne', 'materiel', 'preuve', 'autre'] as const).map(cat => {
                const IconComponent = CATEGORY_ICONS[cat];
                const isActive = currentCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCurrentCategory(cat)}
                    title={cat}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90",
                      isActive
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                        : "bg-white text-slate-500 border border-slate-200/60 hover:text-slate-800"
                    )}
                  >
                    <IconComponent className="h-5 w-5 stroke-[2]" />
                  </button>
                );
              })}
            </div>

            {/* Photo Strip */}
            <div data-testid="finish-job-photo-strip" className="flex flex-wrap gap-3 mt-4 justify-center">
              {photos.map((photo, i) => (
                <div key={`${i}-${photo.url ? photo.url.slice(0, 24) : ''}`} className="relative h-20 w-20 overflow-hidden rounded-[16px] border border-black/5 bg-slate-100 shadow-sm transition-transform hover:scale-105">
                  <div className="absolute top-0 left-0 w-full bg-black/60 text-white text-[10px] font-bold text-center py-0.5 capitalize z-10 backdrop-blur-sm">
                    {photo.category}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt=""
                    className={cn("h-full w-full object-cover", PRESENTATION_PRIVACY_MODE ? "blur-lg" : null)}
                  />
                  <button
                    type="button"
                    data-testid={`finish-job-photo-remove-${i}`}
                    aria-label={String(t("technician_hub.finish.delete_photo"))}
                    onClick={() => removePhoto(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-colors hover:bg-red-500/90 z-20"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              ))}
            </div>

            {/* Next step button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                data-testid="finish-job-continue-photos"
                disabled={photos.length < FINISH_JOB_MIN_PHOTOS}
                onClick={() => {
                  stopCamera();
                  setStep("billing");
                }}
                aria-label={String(t("technician_hub.finish.continue_signature"))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition-all hover:bg-slate-800 active:scale-[0.90] disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowRight className="h-6 w-6 stroke-[2.5]" aria-hidden />
              </button>
            </div>
          </>
        ) : null}

        {step === "billing" && liveIv ? (
          <CategoryFinishChecklist
            intervention={liveIv}
            onCompleteChange={setChecklistComplete}
          />
        ) : null}

        {step === "billing" ? (
          <TechnicianBillingLinesForm
            initialLines={billingLines}
            onConfirm={(confirmed) => {
              if (!checklistComplete) {
                toast.error(String(t("finish_checklist.incomplete")));
                return;
              }
              setBillingLines(confirmed);
              setStep("signature");
            }}
            onSkip={() => {
              setBillingLines([]);
              setStep("signature");
            }}
            onBack={() => {
              setStep("photos");
            }}
            intervention={
              liveIv
                ? { category: liveIv.category, problem: liveIv.problem }
                : undefined
            }
          />
        ) : null}

        {step === "signature" ? (
          <div className="flex flex-col flex-1 gap-5 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-2 px-1">
              <FileSignature className="h-5 w-5 text-slate-800" aria-hidden />
              <h2 className="text-[15px] font-semibold text-slate-800">{String(t("technician_hub.finish.client_signature"))}</h2>
            </div>

            <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/5">
              <TechnicianSignaturePad ref={sigRef} />
            </div>

            <div className="flex gap-4 justify-center mt-2">
              <button
                type="button"
                data-testid="finish-job-back-billing"
                onClick={() => {
                  setStep("billing");
                }}
                aria-label={String(t("technician_hub.finish.back_photos"))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-[0.90]"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" aria-hidden />
              </button>
              <button
                type="button"
                data-testid="finish-job-clear-signature"
                onClick={() => sigRef.current?.clear()}
                aria-label={String(t("technician_hub.finish.clear_signature"))}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm ring-1 ring-slate-200 hover:bg-rose-50 hover:ring-rose-200 transition-all active:scale-[0.90]"
              >
                <RotateCcw className="h-5 w-5 stroke-[2.5]" aria-hidden />
              </button>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                data-testid="finish-job-submit"
                disabled={submitBusy}
                onClick={() => void submitAll()}
                aria-label={String(t("technician_hub.finish.send_closure"))}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.4)] transition-all hover:bg-emerald-600 active:scale-[0.90] disabled:pointer-events-none disabled:opacity-70"
              >
                {submitBusy ? (
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-8 w-8 stroke-[3]" aria-hidden />
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
