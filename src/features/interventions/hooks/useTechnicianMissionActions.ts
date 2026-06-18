"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import { toast } from "sonner";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import {
  getTechnicianAssignmentUid,
  isTechnicianAssignmentAwaitingResponse,
} from "@/features/interventions/technicianAssignmentActions";
import { useInterventionLiveSource } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";
import { useTranslation } from "@/core/i18n/I18nContext";
import { canTechnicianAmendCompletionReport } from "@/features/interventions/technicianCompletionReport";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useMissionTimeTrackingAutomation } from "@/features/timetracking/hooks/useMissionTimeTrackingAutomation";

function isMissionTimeTrackingActive(iv: Intervention, technicianUid: string): boolean {
  const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(iv, technicianUid);
  const isInvoicedOrCancelled = iv.status === "invoiced" || iv.status === "cancelled";
  const isDoneAmendable =
    iv.status === "done" && canTechnicianAmendCompletionReport(iv, technicianUid).allowed;

  return (
    !awaitingAssignment && iv.status !== "assigned" && !isInvoicedOrCancelled && !isDoneAmendable
  );
}

/** Actions terrain partagées (transitions, clôture). */
export function useTechnicianMissionActions({
  caseId,
  liveIntervention,
  technicianUidProp,
}: {
  caseId: string | null;
  liveIntervention?: Intervention | null;
  technicianUidProp?: string | null;
}) {
  const liveIv = useInterventionLiveSource(caseId, liveIntervention);
  const queryClient = useQueryClient();
  const { setFinishJobInterventionId } = useTechnicianFinishJob();
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useTranslation();
  const timetrackingEnabled = useFeatureFlag("unifiedFieldCockpit");

  const technicianUid =
    technicianUidProp?.trim() ||
    getTechnicianAssignmentUid(auth?.currentUser?.uid) ||
    liveIv?.assignedTechnicianUid?.trim() ||
    "";

  const { flushActiveTimeEntry } = useMissionTimeTrackingAutomation({
    enabled: Boolean(
      timetrackingEnabled && caseId && liveIv && isMissionTimeTrackingActive(liveIv, technicianUid)
    ),
    intervention: liveIv ?? undefined,
    technicianUid,
  });

  const awaitingAssignment = liveIv
    ? isTechnicianAssignmentAwaitingResponse(liveIv, technicianUid)
    : false;
  const isInvoicedOrCancelled = liveIv?.status === "invoiced" || liveIv?.status === "cancelled";
  const isDoneAmendable =
    liveIv?.status === "done" && canTechnicianAmendCompletionReport(liveIv, technicianUid).allowed;
  const showActionBar =
    liveIv &&
    !awaitingAssignment &&
    liveIv.status !== "assigned" &&
    !isInvoicedOrCancelled &&
    !isDoneAmendable;

  const handleUpdateStatus = async (newStatus: Intervention["status"], note?: string) => {
    if (isUpdating || !liveIv) return;

    const nowIso = new Date().toISOString();
    const optimisticPatch: Partial<Intervention> = {
      status: newStatus,
      statusUpdatedAt: nowIso,
    };

    patchTechnicianAssignmentInCache(queryClient, technicianUid, liveIv.id, optimisticPatch);

    setIsUpdating(true);
    try {
      await transitionInterventionFromTechnician({
        interventionId: liveIv.id,
        iv: liveIv,
        toStatus: newStatus,
        note,
      });
    } catch (err) {
      patchTechnicianAssignmentInCache(queryClient, technicianUid, liveIv.id, {
        status: liveIv.status,
        statusUpdatedAt: liveIv.statusUpdatedAt,
      });
      logger.error("Failed to update status", {
        error: err instanceof Error ? err.message : String(err),
      });
      const message = err instanceof Error ? err.message : "";
      toast.error(String(t("technician_hub.dashboard.detail.update_failed")), {
        description: message || undefined,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onStartFinishJob = () => {
    if (!liveIv) return;
    void flushActiveTimeEntry();
    setFinishJobInterventionId(liveIv.id);
  };

  return {
    liveIv,
    isUpdating,
    handleUpdateStatus,
    onStartFinishJob,
    technicianUid,
    awaitingAssignment,
    isInvoicedOrCancelled,
    isDoneAmendable,
    showActionBar: Boolean(showActionBar),
  };
}
