"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, CheckCircle2, Pause, Pencil, AlertTriangle } from "lucide-react";
import MissionFieldFooter from "@/features/interventions/components/MissionFieldFooter";
import MissionContactRail from "@/features/interventions/components/MissionContactRail";
import TechnicianMissionBrief from "@/features/interventions/components/TechnicianMissionBrief";
import {
  buildGoogleMapsDirectionsUrl,
  buildMissionContactActions,
} from "@/features/interventions/buildMissionContactActions";
import TechnicianAssignmentRespondBar from "@/features/interventions/components/TechnicianAssignmentRespondBar";
import {
  getTechnicianAssignmentUid,
  isTechnicianAssignmentAwaitingResponse,
} from "@/features/interventions/technicianAssignmentActions";
import { auth } from "@/core/config/firebase";
import { logger } from "@/core/logger";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import { toast } from "sonner";
import { useInterventionLiveSource } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import { interventionDescriptionText } from "@/features/interventions/interventionDescriptionText";
import { formatScheduledTimeOnly } from "@/features/interventions/technicianSchedule";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import { canTechnicianAmendCompletionReport } from "@/features/interventions/technicianCompletionReport";
import { cn } from "@/lib/utils";
import { HubButton } from "@/core/ui/hub";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useMissionTimeTrackingAutomation } from "@/features/timetracking/hooks/useMissionTimeTrackingAutomation";
import TechnicianFinishInvoiceStep from "@/features/interventions/components/TechnicianFinishInvoiceStep";

const AudioUrlPlayer = ({ url, t }: { url: string; t: (key: string) => string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void audioRef.current.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false)
      );
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || time === Infinity) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 px-2 py-1.5">
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onTimeUpdate={() => {
          if (!audioRef.current) return;
          setProgress(audioRef.current.currentTime);
          if (audioRef.current.duration && audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current?.duration && audioRef.current.duration !== Infinity) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
      <button
        type="button"
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700"
        aria-label={
          isPlaying ? t("backoffice.audio_player.pause") : t("backoffice.audio_player.play")
        }
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" fill="currentColor" />
        ) : (
          <Play className="h-3.5 w-3.5 ml-0.5" fill="currentColor" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-100"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-bold tabular-nums text-slate-500">
          <span>{formatTime(progress)}</span>
          <span>{duration > 0 ? formatTime(duration) : "0:00"}</span>
        </div>
      </div>
    </div>
  );
};

function isMissionTimeTrackingActive(iv: Intervention, technicianUid: string): boolean {
  const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(iv, technicianUid);
  const isInvoicedOrCancelled = iv.status === "invoiced" || iv.status === "cancelled";
  const isDoneAmendable =
    iv.status === "done" && canTechnicianAmendCompletionReport(iv, technicianUid).allowed;

  return (
    !awaitingAssignment && iv.status !== "assigned" && !isInvoicedOrCancelled && !isDoneAmendable
  );
}

export default function TechnicianDashboardDetailPanel({
  caseId,
  liveIntervention,
  technicianUid: technicianUidProp,
}: {
  caseId: string | null;
  /** Snapshot partagé depuis `TechnicianHubPage` (évite 2 listeners Firestore sur le même doc). */
  liveIntervention?: Intervention | null;
  /** Même UID que la liste (`useTechnicianAssignments().firebaseUid`). */
  technicianUid?: string | null;
}) {
  const liveIv = useInterventionLiveSource(caseId, liveIntervention);
  const queryClient = useQueryClient();
  const { setFinishJobInterventionId } = useTechnicianFinishJob();
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useTranslation();
  const timetrackingEnabled = useFeatureFlag("unifiedFieldCockpit");

  const technicianUidForTracking =
    technicianUidProp?.trim() ||
    getTechnicianAssignmentUid(auth?.currentUser?.uid) ||
    liveIv?.assignedTechnicianUid?.trim() ||
    "";

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

  if (!caseId) {
    return (
      <div
        data-testid="technician-dashboard-detail-empty"
        className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 text-center"
      >
        <p className="text-[13px] font-bold text-slate-900">
          {t("technician_hub.dashboard.detail.no_mission_selected")}
        </p>
      </div>
    );
  }

  if (!liveIv) {
    return (
      <div
        data-testid="technician-dashboard-detail-loading"
        className="flex min-h-0 flex-1 flex-col gap-2 p-3"
      >
        <div className="h-8 w-2/3 animate-pulse rounded-md bg-slate-200/60" />
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-200/60" />
          ))}
        </div>
      </div>
    );
  }

  const handleUpdateStatus = async (newStatus: Intervention["status"], note?: string) => {
    if (isUpdating) return;

    const technicianUid =
      technicianUidProp?.trim() ||
      getTechnicianAssignmentUid(auth?.currentUser?.uid) ||
      liveIv.assignedTechnicianUid?.trim() ||
      "";

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
      toast.error(String(t("technician_hub.dashboard.detail.update_failed")));
    } finally {
      setIsUpdating(false);
    }
  };

  const onStartFinishJob = () => {
    void flushActiveTimeEntry();
    setFinishJobInterventionId(liveIv.id);
  };

  const technicianUid =
    technicianUidProp?.trim() ||
    getTechnicianAssignmentUid(auth?.currentUser?.uid) ||
    liveIv.assignedTechnicianUid?.trim() ||
    "";
  const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(liveIv, technicianUid);

  let firstName = liveIv.clientFirstName;
  let lastName = liveIv.clientLastName;
  if (!firstName && !lastName && liveIv.clientName) {
    const parts = liveIv.clientName.trim().split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ");
  }

  const clientDisplayName =
    capitalizeName([firstName, lastName].filter(Boolean).join(" ").trim()) ||
    capitalizeName(liveIv.clientName ?? "") ||
    t("technician_hub.dashboard.detail.not_provided");

  const descriptionText = interventionDescriptionText(liveIv);
  const addressMapsHref = buildGoogleMapsDirectionsUrl(liveIv.address);
  const hasAudioBlock = Boolean(liveIv.audioUrl || liveIv.transcription?.trim());
  const isInvoicedOrCancelled = liveIv.status === "invoiced" || liveIv.status === "cancelled";
  const isDoneAmendable =
    liveIv.status === "done" && canTechnicianAmendCompletionReport(liveIv, technicianUid).allowed;
  const showActionBar =
    !awaitingAssignment &&
    liveIv.status !== "assigned" &&
    !isInvoicedOrCancelled &&
    !isDoneAmendable;
  const primaryContactActions =
    showActionBar || isDoneAmendable
      ? buildMissionContactActions({
          intervention: liveIv,
          t,
          primaryOnly: true,
        })
      : [];

  return (
    <div
      data-testid="technician-dashboard-detail"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {isInvoicedOrCancelled ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-6 py-8">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="text-center text-[13px] font-bold text-slate-900">
              {t("technician_hub.dashboard.detail.mission_completed")}
            </p>
          </div>
        </div>
      ) : isDoneAmendable ? (
        <>
          {/* Header shrink-0 : badge + brief client */}
          <div className="flex min-h-0 max-h-[42%] shrink-0 flex-col px-5 pt-4 pb-2">
            <span
              data-testid="technician-detail-done-badge"
              className="mb-3 inline-flex w-fit items-center gap-1.5 self-center rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              {t("technician_hub.dashboard.detail.mission_done_badge")}
            </span>
            <TechnicianMissionBrief
              timeLabel={formatScheduledTimeOnly(liveIv)}
              clientDisplayName={clientDisplayName}
              address={liveIv.address ? formatAddress(liveIv.address) : null}
              addressMapsHref={addressMapsHref}
              descriptionText={descriptionText}
              contactRail={
                primaryContactActions.length > 0 ? (
                  <MissionContactRail variant="compact" actions={primaryContactActions} />
                ) : null
              }
            />
          </div>

          {/* Invoice step — fills remaining height, CTA sticky en interne */}
          {caseId ? (
            <div
              data-testid="technician-detail-scroll"
              className="technician-detail-body mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden px-4"
            >
              <TechnicianFinishInvoiceStep
                interventionId={caseId}
                clientEmail={liveIv.clientEmail}
                clientName={liveIv.clientName}
              />
            </div>
          ) : (
            <p
              data-testid="technician-detail-invoice-pending"
              className="px-4 py-3 text-center text-[11px] font-medium text-slate-500"
            >
              {t("technician_hub.dashboard.detail.invoice_backoffice_pending")}
            </p>
          )}

          <footer className="shrink-0 border-t border-slate-200/50 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <HubButton
              type="button"
              data-testid="technician-edit-completion-report"
              onClick={onStartFinishJob}
              fullWidth
              className="mx-auto h-12 max-w-[20.5rem] rounded-full text-[13px] font-semibold"
            >
              <Pencil className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
              {t("technician_hub.dashboard.detail.edit_report")}
            </HubButton>
          </footer>
        </>
      ) : (
        <>
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              awaitingAssignment && "technician-detail-awaiting-offer"
            )}
            data-testid={
              liveIv.status === "waiting_material"
                ? "technician-detail-waiting-material"
                : undefined
            }
          >
            <div
              className="technician-detail-body flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-5 py-4"
              data-testid="technician-detail-scroll"
            >
              <TechnicianMissionBrief
                timeLabel={formatScheduledTimeOnly(liveIv)}
                clientDisplayName={clientDisplayName}
                address={liveIv.address ? formatAddress(liveIv.address) : null}
                addressMapsHref={addressMapsHref}
                descriptionText={descriptionText}
                awaitingAssignment={awaitingAssignment}
                contactRail={
                  primaryContactActions.length > 0 ? (
                    <MissionContactRail variant="compact" actions={primaryContactActions} />
                  ) : null
                }
              />

              {liveIv.status === "waiting_material" ? (
                <p className="!m-0 shrink-0 border-t border-amber-200/80 pt-3 text-center text-[12px] font-semibold leading-snug text-amber-900 line-clamp-3">
                  {t("technician_hub.dashboard.detail.waiting_material_banner")}
                </p>
              ) : null}

              {liveIv.status === "in_progress" && liveIv.reportRejectionReason?.trim() ? (
                <div
                  data-testid="technician-report-rejected-banner"
                  className="shrink-0 border-t border-amber-200/80 pt-3 text-left"
                >
                  <p className="flex items-center gap-1.5 text-[12px] font-bold text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t("technician_hub.dashboard.detail.report_rejected_title")}
                  </p>
                  <p className="mt-1 text-[12px] font-medium leading-snug text-amber-950">
                    {liveIv.reportRejectionReason.trim()}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-amber-800">
                    {t("technician_hub.dashboard.detail.report_rejected_hint")}
                  </p>
                </div>
              ) : null}

              {hasAudioBlock ? (
                <div className="flex w-full shrink-0 flex-col gap-2 border-t border-slate-200/80 pt-3">
                  {liveIv.audioUrl ? <AudioUrlPlayer url={liveIv.audioUrl} t={t} /> : null}
                  {liveIv.transcription?.trim() ? (
                    <p className="line-clamp-3 text-[12px] font-semibold leading-snug text-slate-800">
                      {liveIv.transcription.trim()}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {awaitingAssignment && technicianUid ? (
            <TechnicianAssignmentRespondBar iv={liveIv} technicianUid={technicianUid} />
          ) : null}

          {showActionBar ? (
            <MissionFieldFooter
              intervention={liveIv}
              isUpdating={isUpdating}
              onPrimaryTransition={(toStatus) => void handleUpdateStatus(toStatus)}
              onFinish={onStartFinishJob}
              onWaitingMaterial={() => void handleUpdateStatus("waiting_material")}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
