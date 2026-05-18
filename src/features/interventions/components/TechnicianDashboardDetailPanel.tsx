"use client";

import { useState } from "react";
import { Play, CheckCircle2, Pause } from "lucide-react";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MissionActionBar from "@/features/interventions/components/MissionActionBar";
import { isTechnicianAssignmentAwaitingResponse } from "@/features/interventions/technicianAssignmentActions";
import { auth, firestore } from "@/core/config/firebase";
import InterventionMaterialOrdersPanel from "@/features/materials/components/InterventionMaterialOrdersPanel";
import { transitionInterventionStatus } from "@/features/interventions/workflow/transitionInterventionStatus";
import { requireAuthTransitionActor } from "@/features/interventions/workflow/workflowActor";
import { toast } from "sonner";
import { useInterventionLive } from "@/features/interventions/useInterventionLive";
import type { Intervention } from "@/features/interventions/types";

import { capitalizeName, formatAddress } from "@/utils/stringUtils";

import {
  formatScheduledTimeOnly,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";
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
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Audio playback failed", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      if (audioRef.current.duration && audioRef.current.duration !== Infinity) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      if (audioRef.current.duration && audioRef.current.duration !== Infinity) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || time === Infinity) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-[16px] border border-slate-200 bg-slate-50/50 p-2 shadow-sm transition-all hover:shadow-md">
      <audio 
        ref={audioRef} 
        src={url}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden" 
      />
      <button 
        type="button"
        onClick={togglePlay}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition hover:scale-105 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600/20"
        aria-label={isPlaying ? t("backoffice.audio_player.pause") : t("backoffice.audio_player.play")}
      >
        {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 px-1">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div 
            className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-100"
            style={{ width: duration > 0 ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold tracking-wider text-slate-500">
          <span>{formatTime(progress)}</span>
          <span>{duration > 0 ? formatTime(duration) : "0:00"}</span>
        </div>
      </div>
    </div>
  );
};

export default function TechnicianDashboardDetailPanel({
  caseId,
}: {
  caseId: string | null;
}) {
  const liveIv = useInterventionLive(caseId);
  const { setFinishJobInterventionId } = useTechnicianFinishJob();
  const pager = useDashboardPagerOptional();
  const [isUpdating, setIsUpdating] = useState(false);
  const [materialsPanelOpen, setMaterialsPanelOpen] = useState(false);
  const { t } = useTranslation();

  if (!caseId) {
    return (
      <div
        data-testid="technician-dashboard-detail-empty"
        style={outfit}
        className="flex h-full w-full flex-col items-center justify-center rounded-[inherit] px-5 py-8 text-center"
      >
        <div className="text-[14px] font-bold text-black">
          {t("technician_hub.dashboard.detail.no_mission_selected")}
        </div>
      </div>
    );
  }

  if (!liveIv) {
    return (
      <div
        data-testid="technician-dashboard-detail-loading"
        style={outfit}
        className="flex h-full w-full flex-col p-4"
      >
        <div className="h-10 w-1/2 animate-pulse rounded-md bg-slate-200/60 mb-6" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-[20px] bg-slate-200/60" />
          ))}
        </div>
      </div>
    );
  }

  const mainContainerClass = "rounded-2xl border border-neutral-200/80 bg-white p-4";

  const handleUpdateStatus = async (newStatus: Intervention["status"], note?: string) => {
    if (!liveIv || isUpdating || !firestore) return;
    setIsUpdating(true);
    try {
      await transitionInterventionStatus({
        db: firestore,
        interventionId: liveIv.id,
        iv: liveIv,
        toStatus: newStatus,
        actor: requireAuthTransitionActor("technician"),
        note,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error(String(t("technician_hub.dashboard.detail.update_failed")));
    } finally {
      setIsUpdating(false);
    }
  };

  const onStartFinishJob = () => {
    setFinishJobInterventionId(liveIv.id);
    navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_FINISH);
  };

  const technicianUid =
    liveIv.assignedTechnicianUid?.trim() || auth?.currentUser?.uid?.trim() || "";
  const awaitingAssignment = isTechnicianAssignmentAwaitingResponse(
    liveIv,
    auth?.currentUser?.uid,
  );

  const renderMaterialOrders = () =>
    technicianUid ? (
      <InterventionMaterialOrdersPanel
        intervention={liveIv}
        technicianUid={technicianUid}
        allowCreate
        allowStatusUpdate={false}
        forceOpen={materialsPanelOpen}
      />
    ) : null;

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

  const renderContactClient = () => (
    <div className="w-full space-y-1">
      <p className="text-[13px] font-semibold tabular-nums text-neutral-500">
        {formatScheduledTimeOnly(liveIv)}
      </p>
      <h1 className="text-[20px] font-bold leading-tight text-neutral-900">{clientDisplayName}</h1>
      {liveIv.address ? (
        <p className="text-[14px] leading-snug text-neutral-600">{formatAddress(liveIv.address)}</p>
      ) : null}
    </div>
  );

  const renderAudioAndTranscription = () => (
    <div className="w-full space-y-2">
      {liveIv.audioUrl ? (
        <AudioUrlPlayer url={liveIv.audioUrl} t={t} />
      ) : (
        <p className="text-[13px] text-neutral-400">{t("technician_hub.dashboard.detail.no_voice_message")}</p>
      )}
      {liveIv.transcription ? (
        <p className="rounded-xl bg-neutral-50 px-3 py-2.5 text-[14px] leading-relaxed text-neutral-800">
          {liveIv.transcription}
        </p>
      ) : null}
    </div>
  );

  const renderAwaitingAssignmentHint = () => (
    <motion.div
      key="assigned-hint"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4 h-full pb-2"
      data-testid="technician-assignment-detail-hint"
    >
      <div className={mainContainerClass}>
        <div className="flex flex-col gap-4">
          <p className="mb-3 text-[13px] font-medium text-amber-800">{t("technician_hub.dashboard.detail.assignment_respond_in_list")}</p>
          {renderContactClient()}
          <div className="mt-4">{renderAudioAndTranscription()}</div>
        </div>
      </div>
    </motion.div>
  );
  const renderPending = () => (
    <motion.div
      key="pending"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4 h-full justify-between pb-2"
    >
      <div className={mainContainerClass}>
        <div className="flex flex-col gap-4">
          {renderContactClient()}
          {liveIv.title ? (
            <p className="text-[15px] font-medium text-neutral-800">{liveIv.title}</p>
          ) : null}
          <div className="mt-2">{renderAudioAndTranscription()}</div>
        </div>
      </div>

    </motion.div>
  );

  const renderEnRoute = () => (
    <motion.div
      key="en_route"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      className="flex flex-col gap-3 pb-2"
    >
      <div className={mainContainerClass}>
        {renderContactClient()}
        {renderAudioAndTranscription()}
      </div>
    </motion.div>
  );

  const renderInProgress = () => (
    <motion.div
      key="in_progress"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4 h-full justify-between pb-2"
    >
      <div className={mainContainerClass}>
        <div className="flex flex-col gap-4">
          {renderContactClient()}
          
          {liveIv.problem && (
            <>
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800">{liveIv.problem}</p>
            </>
          )}
          
          <div className="h-px bg-slate-100/80 w-full" />
          {renderAudioAndTranscription()}
          {renderMaterialOrders()}
        </div>
      </div>


    </motion.div>
  );

  const renderWaitingMaterial = () => (
    <motion.div
      key="waiting_material"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4 h-full justify-between pb-2"
      data-testid="technician-detail-waiting-material"
    >
      <div className={mainContainerClass}>
        <p className="rounded-[16px] border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-center text-[14px] font-semibold text-amber-950">
          {t("technician_hub.dashboard.detail.waiting_material_banner")}
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {renderContactClient()}
          {renderMaterialOrders()}
        </div>
      </div>
    </motion.div>
  );

  const renderDone = () => (
    <motion.div
      key="done"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col gap-4 h-full pb-2"
    >
      <div className="flex flex-col items-center justify-center py-5 bg-white/50 rounded-[16px] border border-emerald-100/50 mt-4 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="text-[14px] font-bold text-black text-center px-4">{t("technician_hub.dashboard.detail.mission_completed")}</div>
      </div>
    </motion.div>
  );

  const renderContent = () => {
    if (liveIv.status === "assigned") {
      return renderAwaitingAssignmentHint();
    }
    if (isInterventionPendingBackOfficeIntake(liveIv)) return renderPending();
    if (liveIv.status === "en_route") return renderEnRoute();
    if (liveIv.status === "waiting_material") return renderWaitingMaterial();
    if (liveIv.status === "in_progress") return renderInProgress();
    if (liveIv.status === "done" || liveIv.status === "invoiced" || liveIv.status === "cancelled") {
      return renderDone();
    }
    return renderPending();
  }

  return (
    <div
      data-testid="technician-dashboard-detail"
      style={outfit}
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-2">
          <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
        </div>
        <MissionActionBar
          intervention={liveIv}
          awaitingAssignment={awaitingAssignment}
          isUpdating={isUpdating}
          onPrimaryTransition={(toStatus) => void handleUpdateStatus(toStatus)}
          onFinish={onStartFinishJob}
          onWaitingMaterial={() => void handleUpdateStatus("waiting_material")}
          onOpenMaterials={() => {
            setMaterialsPanelOpen(true);
            setTimeout(
              () =>
                document
                  .getElementById("technician-material-orders")
                  ?.scrollIntoView({ behavior: "smooth" }),
              50,
            );
          }}
          onQuickPhoto={() => navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_FINISH)}
        />
      </div>
    </div>
  );
}
