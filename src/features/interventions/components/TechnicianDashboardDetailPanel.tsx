"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Play, CheckCircle2, Pause, Loader2 } from "lucide-react";
import MissionActionBar from "@/features/interventions/components/MissionActionBar";
import TechnicianAssignmentRespondBar from "@/features/interventions/components/TechnicianAssignmentRespondBar";
import {
  getTechnicianAssignmentUid,
  isTechnicianAssignmentAwaitingResponse,
} from "@/features/interventions/technicianAssignmentActions";
import { auth } from "@/core/config/firebase";
import InterventionMaterialOrdersPanel from "@/features/materials/components/InterventionMaterialOrdersPanel";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";
import { toast } from "sonner";
import { useInterventionLiveSource } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";
import { capitalizeName, formatAddress } from "@/utils/stringUtils";
import { interventionDescriptionText } from "@/features/interventions/interventionDescriptionText";
import { formatScheduledTimeOnly } from "@/features/interventions/technicianSchedule";
import { useTechnicianFinishJob } from "@/context/TechnicianFinishJobContext";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  navigateTechnicianHub,
  TECHNICIAN_HUB_ANCHOR_FINISH,
} from "@/features/interventions/technicianHubNavigation";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

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
        () => setIsPlaying(false),
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
        aria-label={isPlaying ? t("backoffice.audio_player.pause") : t("backoffice.audio_player.play")}
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
  const pager = useDashboardPagerOptional();
  const [isUpdating, setIsUpdating] = useState(false);
  const [materialsPanelOpen, setMaterialsPanelOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setMaterialsPanelOpen(false);
  }, [caseId]);

  if (!caseId) {
    return (
      <div
        data-testid="technician-dashboard-detail-empty"
        style={outfit}
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
        style={outfit}
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

    patchTechnicianAssignmentInCache(
      queryClient,
      technicianUid,
      liveIv.id,
      optimisticPatch,
    );

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
      console.error("Failed to update status", err);
      toast.error(String(t("technician_hub.dashboard.detail.update_failed")));
    } finally {
      setIsUpdating(false);
    }
  };

  const onStartFinishJob = () => {
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
  const hasAudioBlock = Boolean(liveIv.audioUrl || liveIv.transcription?.trim());
  const showMaterials =
    Boolean(technicianUid) &&
    (liveIv.status === "in_progress" || liveIv.status === "waiting_material");
  const isTerminal =
    liveIv.status === "done" || liveIv.status === "invoiced" || liveIv.status === "cancelled";
  const showActionBar = !awaitingAssignment && liveIv.status !== "assigned" && !isTerminal;

  return (
    <div
      data-testid="technician-dashboard-detail"
      style={outfit}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {isTerminal ? (
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
      ) : (
        <>
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-neutral-200/80 bg-white mx-3 mt-2"
            data-testid={
              liveIv.status === "waiting_material" ? "technician-detail-waiting-material" : undefined
            }
          >
            <header className="shrink-0 border-b border-neutral-100 px-3 py-2">
              <p className="text-[11px] font-semibold tabular-nums text-neutral-500">
                {formatScheduledTimeOnly(liveIv)}
              </p>
              <h1 className="text-[16px] font-bold leading-tight text-neutral-900">{clientDisplayName}</h1>
              {liveIv.address ? (
                <p className="text-[12px] leading-snug text-neutral-600">{formatAddress(liveIv.address)}</p>
              ) : null}
            </header>

            <div
              className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2"
              data-testid="technician-detail-scroll"
            >
              <div className="flex flex-col gap-2.5">
                {liveIv.status === "waiting_material" ? (
                  <p className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-center text-[11px] font-semibold text-neutral-700">
                    {t("technician_hub.dashboard.detail.waiting_material_banner")}
                  </p>
                ) : null}

                {descriptionText ? (
                  <div data-testid="technician-detail-description">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {t("technician_hub.dashboard.detail.description_label")}
                    </p>
                    <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-neutral-800">
                      {descriptionText}
                    </p>
                  </div>
                ) : null}

                {hasAudioBlock ? (
                  <div className="flex flex-col gap-1.5">
                    {liveIv.audioUrl ? <AudioUrlPlayer url={liveIv.audioUrl} t={t} /> : null}
                    {liveIv.transcription?.trim() ? (
                      <p className="rounded-lg bg-neutral-50 px-2.5 py-1.5 text-[12px] leading-relaxed text-neutral-700">
                        {liveIv.transcription.trim()}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {showMaterials ? (
                  <InterventionMaterialOrdersPanel
                    intervention={liveIv}
                    technicianUid={technicianUid}
                    allowCreate
                    allowStatusUpdate={false}
                    expanded={materialsPanelOpen}
                    onExpandedChange={setMaterialsPanelOpen}
                    compact
                  />
                ) : null}
              </div>
            </div>
          </div>

          {awaitingAssignment && technicianUid ? (
            <TechnicianAssignmentRespondBar iv={liveIv} technicianUid={technicianUid} />
          ) : null}

          {showActionBar ? (
            <MissionActionBar
              compact
              intervention={liveIv}
              awaitingAssignment={false}
              isUpdating={isUpdating}
              onPrimaryTransition={(toStatus) => void handleUpdateStatus(toStatus)}
              onFinish={onStartFinishJob}
              onWaitingMaterial={() => void handleUpdateStatus("waiting_material")}
              onOpenMaterials={() => setMaterialsPanelOpen(true)}
              onQuickPhoto={() => navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_FINISH)}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
