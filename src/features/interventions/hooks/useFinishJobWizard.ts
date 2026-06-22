"use client";

import { logger } from "@/core/logger";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { auth } from "@/core/config/firebase";
import { useOfflineSyncOptional } from "@/context/OfflineSyncContext";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
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
import type { TechnicianSignaturePadHandle } from "@/features/interventions/components/TechnicianSignaturePad";
import { useTechnicianBackofficeReportBridgeOptional } from "@/context/TechnicianBackofficeReportBridgeContext";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { FinishJobStep } from "@/features/interventions/components/FinishJobStepIndicator";
import type { DraftBillingLine } from "@/features/interventions/draftInvoiceBilling";
import {
  finishWizardPhotosFromIntervention,
  type FinishWizardPhoto,
} from "@/features/interventions/technicianCompletionReport";
import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { getTechnicianAssignmentUid } from "@/features/interventions/technicianAssignmentActions";
import { useQueryClient } from "@tanstack/react-query";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import { FINISH_JOB_DEFAULT_PHOTO_CATEGORY } from "@/features/interventions/finishJobWizardMotion";

export function useFinishJobWizard() {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const queryClient = useQueryClient();
  const {
    finishJobInterventionId,
    finishJobEntryStep,
    setFinishJobInterventionId,
    setFinishWizardStep,
  } = useTechnicianFinishJob();
  const offlineSync = useOfflineSyncOptional();
  const backofficeBridge = useTechnicianBackofficeReportBridgeOptional();

  const [step, setStep] = useState<FinishJobStep>("photos");
  const [draftBillingLines, setDraftBillingLines] = useState<DraftBillingLine[]>([]);
  const [draftAiNote, setDraftAiNote] = useState<string | null>(null);
  const [photos, setPhotos] = useState<FinishWizardPhoto[]>([]);
  const [preservedSignatureUrl, setPreservedSignatureUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sigRef = useRef<TechnicianSignaturePadHandle>(null);

  const [submitBusy, setSubmitBusy] = useState(false);
  const submitInFlightRef = useRef(false);
  const hydratedReportRef = useRef<string | null>(null);
  const wizardMissionIdRef = useRef<string | null>(null);

  const interventionId = finishJobInterventionId;
  const liveIv = useInterventionLive(interventionId);
  const liveStatus = liveIv?.status;
  const isAmendMode = liveStatus === "done";
  const isInvoicedAmendMode = liveStatus === "invoiced";

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

  const captureShot = useCallback(() => {
    const v = videoRef.current;
    if (!v || photos.length >= FINISH_JOB_MAX_PHOTOS) return;
    try {
      const url = capturePhotoFromVideo(v);
      setPhotos((p) => [...p, { url, category: FINISH_JOB_DEFAULT_PHOTO_CATEGORY }]);
    } catch {
      toast.error(String(t("technician_hub.finish.toasts.photo_impossible")));
    }
  }, [photos.length, t]);

  const removePhoto = useCallback((idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
  }, []);

  const resetWizard = useCallback(() => {
    stopCamera();
    setPhotos([]);
    sigRef.current?.clear();
    setPreservedSignatureUrl(null);
    setStep("photos");
    setDraftBillingLines([]);
    setDraftAiNote(null);
    hydratedReportRef.current = null;
  }, [stopCamera]);

  const prefetchDraftBilling = useCallback(async (ivId: string) => {
    try {
      const res = await fetchWithAuth(
        `/api/interventions/${encodeURIComponent(ivId)}/prepare-draft-billing`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ forceRegenerate: true }),
        }
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
    if (!interventionId) {
      wizardMissionIdRef.current = null;
      return;
    }
    if (wizardMissionIdRef.current === interventionId) return;
    wizardMissionIdRef.current = interventionId;
    resetWizard();
    if (finishJobEntryStep === "invoice") {
      setStep("billing");
      void prefetchDraftBilling(interventionId);
    }
  }, [interventionId, finishJobEntryStep, prefetchDraftBilling, resetWizard]);

  useEffect(() => {
    if (!interventionId || isAmendMode || isInvoicedAmendMode) return;
    void prefetchDraftBilling(interventionId);
  }, [interventionId, isAmendMode, isInvoicedAmendMode, prefetchDraftBilling]);

  useEffect(() => {
    if (!liveIv || hydratedReportRef.current === liveIv.id) return;
    if (liveIv.status !== "done" && liveIv.status !== "invoiced") return;
    hydratedReportRef.current = liveIv.id;
    const existingPhotos = finishWizardPhotosFromIntervention(liveIv);
    if (existingPhotos.length > 0) {
      setPhotos(existingPhotos);
    }
    const existingSignature = liveIv.completionSignatureUrl?.trim();
    if (existingSignature) {
      setPreservedSignatureUrl(existingSignature);
    }
  }, [liveIv]);

  useEffect(() => {
    if (!interventionId) {
      setFinishWizardStep(null);
      return;
    }
    setFinishWizardStep(step);
  }, [interventionId, step, setFinishWizardStep]);

  useEffect(() => {
    return () => setFinishWizardStep(null);
  }, [interventionId, setFinishWizardStep]);

  const goDashboard = useCallback(() => {
    setFinishJobInterventionId(null);
    resetWizard();
    navigateTechnicianHub(pager ?? undefined, TECHNICIAN_HUB_ANCHOR_MISSIONS);
  }, [pager, resetWizard, setFinishJobInterventionId]);

  const handleInvoiceSent = useCallback(() => {
    const uid = getTechnicianAssignmentUid(auth?.currentUser?.uid ?? null);
    if (interventionId) {
      patchTechnicianAssignmentInCache(queryClient, uid, interventionId, {
        status: "invoiced",
        statusUpdatedAt: new Date().toISOString(),
      });
    }
    stopCamera();
    setStep("closed");
  }, [interventionId, queryClient, stopCamera]);

  const goToSignature = useCallback(() => {
    stopCamera();
    setStep("signature");
  }, [stopCamera]);

  const submitAll = useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (!interventionId || !auth?.currentUser) {
      toast.error(String(t("technician_hub.finish.toasts.login_required")));
      return;
    }
    const sig =
      sigRef.current?.getPngDataUrl() ??
      preservedSignatureUrl ??
      liveIv?.completionSignatureUrl ??
      null;
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
          note: isInvoicedAmendMode
            ? `Rapport facturé modifié (${photoDataUrls.length} photo(s))`
            : isAmendMode
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

      if (isInvoicedAmendMode) {
        toast.success(String(t("technician_hub.finish.toasts.invoiced_report_updated")), {
          description: String(t("technician_hub.finish.toasts.invoiced_report_updated_desc")),
        });
        goDashboard();
        return;
      }

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
  }, [
    backofficeBridge,
    goDashboard,
    interventionId,
    isAmendMode,
    isInvoicedAmendMode,
    liveIv,
    offlineSync,
    photos,
    prefetchDraftBilling,
    preservedSignatureUrl,
    queryClient,
    stopCamera,
    t,
  ]);

  const photosReady = photos.length >= FINISH_JOB_MIN_PHOTOS;

  return {
    pager,
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
  };
}
