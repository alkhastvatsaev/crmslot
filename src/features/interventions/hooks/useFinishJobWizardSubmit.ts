"use client";

import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { PRESENTATION_PRIVACY_MODE } from "@/core/config/presentationMode";
import { useOfflineSyncOptional } from "@/context/OfflineSyncContext";
import { useTechnicianBackofficeReportBridgeOptional } from "@/context/TechnicianBackofficeReportBridgeContext";
import { logCrmInterventionAction } from "@/features/crmHistory/logCrmInterventionAction";
import { finalizeCompletionOfflineAware } from "@/features/interventions/completionUpload";
import type { FinishJobStep } from "@/features/interventions/components/FinishJobStepIndicator";
import type { TechnicianSignaturePadHandle } from "@/features/interventions/components/TechnicianSignaturePad";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { getTechnicianAssignmentUid } from "@/features/interventions/technicianAssignmentActions";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import type { FinishWizardPhoto } from "@/features/interventions/technicianCompletionReport";
import type { Intervention } from "@/features/interventions/types";
import type { useDashboardPagerOptional } from "@/features/dashboard";
import { useQueryClient } from "@tanstack/react-query";

type Pager = ReturnType<typeof useDashboardPagerOptional>;

type Args = {
  interventionId: string | null;
  liveIv: Intervention | null | undefined;
  isAmendMode: boolean;
  isInvoicedAmendMode: boolean;
  photos: FinishWizardPhoto[];
  preservedSignatureUrl: string | null;
  sigRef: RefObject<TechnicianSignaturePadHandle | null>;
  stopCamera: () => void;
  setStep: Dispatch<SetStateAction<FinishJobStep>>;
  resetWizard: () => void;
  setFinishJobInterventionId: (id: string | null) => void;
  pager: Pager;
  prefetchDraftBilling: (ivId: string) => Promise<void>;
  t: (key: string) => string;
};

export function useFinishJobWizardSubmit({
  interventionId,
  liveIv,
  isAmendMode,
  isInvoicedAmendMode,
  photos,
  preservedSignatureUrl,
  sigRef,
  stopCamera,
  setStep,
  resetWizard,
  setFinishJobInterventionId,
  pager,
  prefetchDraftBilling,
  t,
}: Args) {
  const queryClient = useQueryClient();
  const offlineSync = useOfflineSyncOptional();
  const backofficeBridge = useTechnicianBackofficeReportBridgeOptional();
  const [submitBusy, setSubmitBusy] = useState(false);
  const submitInFlightRef = useRef(false);

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
  }, [interventionId, queryClient, stopCamera, setStep]);

  const goToSignature = useCallback(() => {
    stopCamera();
    setStep("signature");
  }, [stopCamera, setStep]);

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
    sigRef,
    stopCamera,
    setStep,
    t,
  ]);

  return {
    submitBusy,
    submitAll,
    goDashboard,
    goToSignature,
    handleInvoiceSent,
  };
}
