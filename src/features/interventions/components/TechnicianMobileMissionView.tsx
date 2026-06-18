"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Navigation2,
  Pencil,
  Play,
} from "lucide-react";
import MissionContactRail from "@/features/interventions/components/MissionContactRail";
import TechnicianAssignmentRespondBar from "@/features/interventions/components/TechnicianAssignmentRespondBar";
import TechnicianFinishInvoiceStep from "@/features/interventions/components/TechnicianFinishInvoiceStep";
import { buildMissionContactActions } from "@/features/interventions/buildMissionContactActions";
import { buildTechnicianMissionPresentation } from "@/features/interventions/technicianMissionPresentation";
import { useTechnicianMissionActions } from "@/features/interventions/hooks/useTechnicianMissionActions";
import {
  resolveMissionActionBar,
  type MissionActionVariant,
} from "@/features/interventions/missionActionBar";
import type { Intervention } from "@/features/interventions/types";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";

type Props = {
  caseId: string | null;
  liveIntervention?: Intervention | null;
  technicianUid?: string | null;
  onAssignmentAccepted?: (next: Intervention) => void;
  onAssignmentDeclined?: () => void;
};

function transitionButtonClass(variant: MissionActionVariant): string {
  switch (variant) {
    case "amber":
      return "border-amber-300 bg-amber-500 text-white active:bg-amber-400";
    case "emerald":
      return "border-emerald-300 bg-emerald-600 text-white active:bg-emerald-500";
    case "purple":
      return "border-violet-300 bg-violet-600 text-white active:bg-violet-500";
    case "blue":
    default:
      return "border-blue-300 bg-blue-600 text-white active:bg-blue-500";
  }
}

function renderTransitionIcon(toStatus: Intervention["status"]) {
  const className = "h-6 w-6 shrink-0";
  const stroke = 2.25;
  if (toStatus === "en_route") {
    return <Navigation2 className={className} strokeWidth={stroke} aria-hidden />;
  }
  if (toStatus === "in_progress") {
    return <MapPin className={className} strokeWidth={stroke} aria-hidden />;
  }
  return <Play className={className} strokeWidth={stroke} aria-hidden />;
}

/** Écran mission mobile — une info principale, un CTA, détails repliables. */
export default function TechnicianMobileMissionView({
  caseId,
  liveIntervention,
  technicianUid: technicianUidProp,
  onAssignmentAccepted,
  onAssignmentDeclined,
}: Props) {
  const { t } = useTranslation();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const {
    liveIv,
    isUpdating,
    handleUpdateStatus,
    onStartFinishJob,
    technicianUid,
    awaitingAssignment,
    isInvoicedOrCancelled,
    isDoneAmendable,
    showActionBar,
  } = useTechnicianMissionActions({
    caseId,
    liveIntervention,
    technicianUidProp,
  });

  if (!caseId) {
    return (
      <div
        data-testid="technician-mobile-mission-empty"
        className="flex flex-1 flex-col items-center justify-center px-6 text-center"
      >
        <p className="text-[17px] font-semibold text-slate-500">
          {t("technician_hub.dashboard.detail.no_mission_selected")}
        </p>
      </div>
    );
  }

  if (!liveIv) {
    return (
      <div
        data-testid="technician-mobile-mission-loading"
        className="flex flex-1 flex-col gap-4 p-6"
      >
        <div className="h-12 w-28 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200/70" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-slate-200/60" />
      </div>
    );
  }

  const presentation = buildTechnicianMissionPresentation(liveIv, t);
  const actionConfig = resolveMissionActionBar(liveIv, { awaitingAssignment });
  const primary = actionConfig.primary;
  const contactActions = buildMissionContactActions({
    intervention: liveIv,
    t,
    awaitingAssignment,
    primaryOnly: true,
  });

  const hasExtraDetails =
    Boolean(presentation.descriptionText) ||
    Boolean(liveIv.audioUrl) ||
    Boolean(liveIv.transcription?.trim()) ||
    Boolean(liveIv.reportRejectionReason?.trim());

  if (isInvoicedOrCancelled) {
    return (
      <div
        data-testid="technician-mobile-mission-done"
        className="flex flex-1 flex-col items-center justify-center px-6"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <p className="mt-4 text-center text-[18px] font-bold text-slate-900">
          {t("technician_hub.dashboard.detail.mission_completed")}
        </p>
      </div>
    );
  }

  if (isDoneAmendable) {
    return (
      <div
        data-testid="technician-mobile-mission-amend"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 px-5 pt-5 pb-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-[12px] font-semibold text-white">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            {t("technician_hub.dashboard.detail.mission_done_badge")}
          </span>
          <p className="mt-3 text-[28px] font-bold leading-tight text-slate-900">
            {presentation.clientDisplayName}
          </p>
          <p className="mt-1 text-[22px] font-bold tabular-nums text-slate-600">
            {presentation.timeLabel}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <TechnicianFinishInvoiceStep
            interventionId={caseId}
            clientEmail={liveIv.clientEmail}
            clientName={liveIv.clientName}
          />
        </div>
        <footer className="shrink-0 border-t border-slate-200/60 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            data-testid="technician-edit-completion-report"
            onClick={onStartFinishJob}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-[16px] font-bold text-white active:bg-slate-800"
          >
            <Pencil className="h-5 w-5" aria-hidden />
            {t("technician_hub.dashboard.detail.edit_report")}
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div
      data-testid="technician-mobile-mission"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6 pb-4">
        {awaitingAssignment ? (
          <p className="mb-3 text-center text-[13px] font-bold uppercase tracking-wide text-blue-600">
            {t("technician_hub.dashboard.detail.new_assignment")}
          </p>
        ) : null}

        <p
          data-testid="technician-mobile-mission-time"
          className="text-center text-[40px] font-bold tabular-nums leading-none text-slate-900"
        >
          {presentation.timeLabel}
        </p>
        <h1
          data-testid="technician-mobile-mission-client"
          className="mt-3 text-center text-[26px] font-bold leading-tight text-slate-900"
        >
          {presentation.clientDisplayName}
        </h1>

        {presentation.address ? (
          presentation.addressMapsHref ? (
            <a
              href={presentation.addressMapsHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="technician-mobile-mission-address"
              className="mt-4 block text-center text-[17px] font-semibold leading-snug text-blue-600 underline-offset-2 active:underline"
            >
              {presentation.address}
            </a>
          ) : (
            <p
              data-testid="technician-mobile-mission-address"
              className="mt-4 text-center text-[17px] font-medium leading-snug text-slate-600"
            >
              {presentation.address}
            </p>
          )
        ) : (
          <p className="mt-4 text-center text-[15px] font-medium text-slate-400">
            {t("technician_hub.dashboard.detail.no_address")}
          </p>
        )}

        {presentation.descriptionText && !detailsOpen ? (
          <p className="mt-5 line-clamp-2 text-center text-[15px] font-medium leading-snug text-slate-700">
            {presentation.descriptionText}
          </p>
        ) : null}

        {liveIv.status === "waiting_material" ? (
          <p
            data-testid="technician-detail-waiting-material"
            className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-center text-[14px] font-semibold text-amber-900"
          >
            {t("technician_hub.dashboard.detail.waiting_material_banner")}
          </p>
        ) : null}

        {contactActions.length > 0 ? (
          <div className="mt-8">
            <MissionContactRail variant="compact" actions={contactActions} className="gap-5" />
          </div>
        ) : null}

        {hasExtraDetails ? (
          <div className="mt-6">
            <button
              type="button"
              data-testid="technician-mobile-details-toggle"
              onClick={() => setDetailsOpen((v) => !v)}
              className="mx-auto flex items-center gap-1 text-[14px] font-semibold text-slate-500"
            >
              {detailsOpen
                ? t("technician_hub.dashboard.field_footer.less")
                : t("technician_hub.dashboard.field_footer.more")}
              <ChevronDown
                className={cn("h-4 w-4 transition", detailsOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {detailsOpen ? (
              <div
                data-testid="technician-mobile-details-panel"
                className="mt-4 space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4"
              >
                {presentation.descriptionText ? (
                  <p className="text-[15px] font-medium leading-relaxed text-slate-800">
                    {presentation.descriptionText}
                  </p>
                ) : null}
                {liveIv.audioUrl ? (
                  <audio
                    controls
                    src={liveIv.audioUrl}
                    className="w-full"
                    data-testid="technician-mobile-audio"
                  />
                ) : null}
                {liveIv.transcription?.trim() ? (
                  <p className="text-[14px] font-medium leading-snug text-slate-700">
                    {liveIv.transcription.trim()}
                  </p>
                ) : null}
                {liveIv.status === "in_progress" && liveIv.reportRejectionReason?.trim() ? (
                  <div data-testid="technician-report-rejected-banner">
                    <p className="flex items-center gap-1.5 text-[14px] font-bold text-amber-900">
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                      {t("technician_hub.dashboard.detail.report_rejected_title")}
                    </p>
                    <p className="mt-1 text-[14px] font-medium text-amber-950">
                      {liveIv.reportRejectionReason.trim()}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {awaitingAssignment && technicianUid ? (
        <TechnicianAssignmentRespondBar
          iv={liveIv}
          technicianUid={technicianUid}
          onAccepted={onAssignmentAccepted}
          onDeclined={onAssignmentDeclined}
        />
      ) : null}

      {showActionBar && primary ? (
        <footer
          data-testid="mission-action-bar"
          className="shrink-0 border-t border-slate-200/60 bg-white px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {liveIv.status === "in_progress" && actionConfig.canMaterials ? (
            <button
              type="button"
              data-testid="technician-waiting-material-btn"
              disabled={isUpdating}
              onClick={() => void handleUpdateStatus("waiting_material")}
              className="mb-3 w-full text-center text-[13px] font-semibold text-slate-500 underline-offset-2 active:underline"
            >
              {t("technician_hub.dashboard.detail.waiting_material")}
            </button>
          ) : null}

          {primary.kind === "finish" ? (
            <button
              type="button"
              data-testid="mission-action-primary-finish"
              disabled={isUpdating}
              onClick={onStartFinishJob}
              className="flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-900 text-[17px] font-bold text-white shadow-lg active:bg-slate-800 disabled:opacity-60"
            >
              {isUpdating ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              ) : (
                <Camera className="h-6 w-6" strokeWidth={2.25} aria-hidden />
              )}
              {t(primary.labelKey)}
            </button>
          ) : (
            <button
              type="button"
              data-testid={primary.testId}
              disabled={isUpdating}
              onClick={() => void handleUpdateStatus(primary.toStatus)}
              className={cn(
                "flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-2xl border text-[17px] font-bold shadow-lg transition active:scale-[0.99] disabled:opacity-60",
                transitionButtonClass(primary.variant)
              )}
            >
              {isUpdating ? (
                <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              ) : (
                renderTransitionIcon(primary.toStatus)
              )}
              {t(primary.labelKey)}
            </button>
          )}
        </footer>
      ) : null}
    </div>
  );
}
