"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { toast } from "sonner";
import { useInterventionLiveSource } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";
import {
  acceptTechnicianAssignmentPatch,
  isTechnicianAssignmentAwaitingResponse,
} from "@/features/interventions/technicianAssignmentActions";
import { acceptTechnicianAssignment } from "@/features/interventions/respondToTechnicianAssignment";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import {
  isInterventionBeforeScheduledSlot,
  isTechnicianEarlyStartPromptEligible,
} from "@/features/interventions/technicianSchedule";
import { buildMissionContactActions } from "@/features/interventions/buildMissionContactActions";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useMissionTimeTrackingAutomation } from "@/features/timetracking/hooks/useMissionTimeTrackingAutomation";
import {
  buildTechnicianDetailPresentation,
  getTechnicianDetailViewFlags,
  isMissionTimeTrackingActive,
  resolveTechnicianUid,
} from "@/features/interventions/technicianDashboardDetailHelpers";

export function useTechnicianDashboardDetailController({
  caseId,
  liveIntervention,
  technicianUid: technicianUidProp,
  onAssignmentAccepted,
  onAssignmentDeclined: _onAssignmentDeclined,
}: {
  caseId: string | null;
  liveIntervention?: Intervention | null;
  technicianUid?: string | null;
  onAssignmentAccepted?: (next: Intervention) => void;
  onAssignmentDeclined?: () => void;
}) {
  const liveIv = useInterventionLiveSource(caseId, liveIntervention);
  const queryClient = useQueryClient();
  const { setFinishJobInterventionId } = useTechnicianFinishJob();
  const [isUpdating, setIsUpdating] = useState(false);
  const [earlyStartDismissed, setEarlyStartDismissed] = useState(false);
  const { t } = useTranslation();
  const timetrackingEnabled = useFeatureFlag("unifiedFieldCockpit");

  useEffect(() => {
    setEarlyStartDismissed(false);
  }, [caseId, liveIv?.status]);

  const technicianUidForTracking = resolveTechnicianUid(
    technicianUidProp,
    auth?.currentUser?.uid,
    liveIv
  );

  const { flushActiveTimeEntry } = useMissionTimeTrackingAutomation({
    enabled: Boolean(
      timetrackingEnabled &&
      caseId &&
      liveIv &&
      isMissionTimeTrackingActive(liveIv, technicianUidForTracking)
    ),
    intervention: liveIv ?? undefined,
    technicianUid: technicianUidForTracking,
  });

  const handleUpdateStatus = async (newStatus: Intervention["status"], note?: string) => {
    if (isUpdating || !liveIv) return;

    const technicianUid = resolveTechnicianUid(technicianUidProp, auth?.currentUser?.uid, liveIv);
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

  if (!caseId || !liveIv) {
    return {
      caseId,
      liveIv,
      queryClient,
      t,
      isUpdating,
      earlyStartDismissed,
      setEarlyStartDismissed,
      handleUpdateStatus,
      handleEarlyStartConfirm: async () => {},
      onStartFinishJob,
      technicianUid: "",
      viewFlags: null,
      presentation: null,
      primaryContactActions: [],
      showEarlyStartPrompt: false,
    };
  }

  const technicianUid = resolveTechnicianUid(technicianUidProp, auth?.currentUser?.uid, liveIv);
  const viewFlags = getTechnicianDetailViewFlags(liveIv, technicianUid);
  const presentation = buildTechnicianDetailPresentation(liveIv, t);
  const showEarlyStartPrompt =
    !earlyStartDismissed &&
    isInterventionBeforeScheduledSlot(liveIv) &&
    isTechnicianEarlyStartPromptEligible(liveIv.status);

  const handleEarlyStartConfirm = async () => {
    if (isUpdating) return;
    setEarlyStartDismissed(true);

    const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(liveIv, technicianUid);
    if (awaitingAssignment && technicianUid) {
      const acceptPatch = acceptTechnicianAssignmentPatch();
      const optimistic: Partial<Intervention> = {
        status: "en_route",
        technicianAcceptedAt: String(acceptPatch.technicianAcceptedAt),
      };
      patchTechnicianAssignmentInCache(queryClient, technicianUid, liveIv.id, optimistic);
      setIsUpdating(true);
      try {
        await acceptTechnicianAssignment(liveIv);
        onAssignmentAccepted?.({ ...liveIv, ...optimistic } as Intervention);
        toast.success(String(t("technician_hub.dashboard.detail.assignment_accepted")));
      } catch (err) {
        patchTechnicianAssignmentInCache(queryClient, technicianUid, liveIv.id, {
          status: liveIv.status,
          technicianAcceptedAt: liveIv.technicianAcceptedAt,
        });
        setEarlyStartDismissed(false);
        logger.error("acceptTechnicianAssignment", {
          error: err instanceof Error ? err.message : String(err),
        });
        const message = err instanceof Error ? err.message : "";
        toast.error(String(t("technician_hub.dashboard.detail.assignment_action_failed")), {
          description: message || undefined,
        });
      } finally {
        setIsUpdating(false);
      }
      return;
    }

    if (liveIv.status === "en_route") {
      await handleUpdateStatus("in_progress");
    }
  };

  const primaryContactActions =
    viewFlags.showActionBar || viewFlags.isDoneAmendable
      ? buildMissionContactActions({
          intervention: liveIv,
          t,
          primaryOnly: true,
        })
      : [];

  return {
    caseId,
    liveIv,
    t,
    isUpdating,
    earlyStartDismissed,
    setEarlyStartDismissed,
    handleUpdateStatus,
    handleEarlyStartConfirm,
    onStartFinishJob,
    technicianUid,
    viewFlags,
    presentation,
    primaryContactActions,
    showEarlyStartPrompt,
    queryClient,
  };
}
