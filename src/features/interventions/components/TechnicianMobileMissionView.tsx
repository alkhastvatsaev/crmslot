"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Camera,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  Navigation2,
  Pencil,
  Phone,
  Play,
} from "lucide-react";
import TechnicianFinishInvoiceStep from "@/features/interventions/components/TechnicianFinishInvoiceStep";
import TechnicianMobileRespondBar from "@/features/interventions/components/TechnicianMobileRespondBar";
import { buildGoogleMapsDirectionsUrl } from "@/features/interventions/buildMissionContactActions";
import { buildTechnicianMissionPresentation } from "@/features/interventions/technicianMissionPresentation";
import { useTechnicianMissionActions } from "@/features/interventions/hooks/useTechnicianMissionActions";
import { resolveTechnicianMissionStepVisual } from "@/features/interventions/technicianMobileMissionSteps";
import { resolveMissionActionBar } from "@/features/interventions/missionActionBar";
import type { Intervention } from "@/features/interventions/types";
import { useTranslation } from "@/core/i18n/I18nContext";
import { cn } from "@/lib/utils";
import "./technician-mobile-mission.css";

type Props = {
  caseId: string | null;
  liveIntervention?: Intervention | null;
  technicianUid?: string | null;
  onAssignmentAccepted?: (next: Intervention) => void;
  onAssignmentDeclined?: () => void;
};

function ctaPillClass(kind: "primary" | "amber" | "blue" | "finish"): string {
  if (kind === "amber") return "tm-cta-pill tm-cta-pill--amber";
  if (kind === "blue") return "tm-cta-pill tm-cta-pill--blue";
  if (kind === "finish") return "tm-cta-pill tm-cta-pill--finish";
  return "tm-cta-pill tm-cta-pill--primary";
}

function MissionStepTrack({ activeIndex, paused }: { activeIndex: number; paused: boolean }) {
  return (
    <div className="tm-step-track" data-testid="technician-mobile-step-track" aria-hidden>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "tm-step-segment",
            index <= activeIndex &&
              (paused && index === 2 ? "tm-step-segment--paused" : "tm-step-segment--done")
          )}
        />
      ))}
    </div>
  );
}

/** Panneau central terrain — carte sombre, CTA flottant, zéro bruit. */
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
      <div data-testid="technician-mobile-mission-empty" className="tm-empty-state">
        <div className="tm-empty-state__icon">
          <CalendarClock className="h-7 w-7" aria-hidden />
        </div>
        <p className="mt-4 text-[17px] font-semibold text-zinc-500">
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
        <div className="h-3 w-full animate-pulse rounded-full bg-zinc-200" />
        <div className="h-44 animate-pulse rounded-[1.5rem] bg-zinc-200/80" />
      </div>
    );
  }

  const presentation = buildTechnicianMissionPresentation(liveIv, t);
  const actionConfig = resolveMissionActionBar(liveIv, { awaitingAssignment });
  const primary = actionConfig.primary;
  const phone = liveIv.clientPhone || liveIv.phone;
  const mapsUrl = buildGoogleMapsDirectionsUrl(liveIv.address);
  const stepVisual = resolveTechnicianMissionStepVisual(liveIv, awaitingAssignment);

  const hasExtraDetails =
    Boolean(presentation.descriptionText) ||
    Boolean(liveIv.audioUrl) ||
    Boolean(liveIv.transcription?.trim()) ||
    Boolean(liveIv.reportRejectionReason?.trim());

  if (isInvoicedOrCancelled) {
    return (
      <div data-testid="technician-mobile-mission-done" className="tm-empty-state">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" aria-hidden />
        </div>
        <p className="mt-4 max-w-[16rem] text-[18px] font-bold text-zinc-900">
          {t("technician_hub.dashboard.detail.mission_completed")}
        </p>
      </div>
    );
  }

  if (isDoneAmendable) {
    return (
      <div
        data-testid="technician-mobile-mission-amend"
        className="technician-field-screen relative flex min-h-0 flex-1 flex-col overflow-hidden"
        data-ui-version="field-v2"
      >
        <div className="shrink-0 px-4 pt-4">
          <div className="tm-hero">
            <p className="tm-hero__time">{presentation.timeLabel}</p>
            <h1 className="tm-hero__name">{presentation.clientDisplayName}</h1>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
          <TechnicianFinishInvoiceStep
            interventionId={caseId}
            clientEmail={liveIv.clientEmail}
            clientName={liveIv.clientName}
          />
        </div>
        <div className="tm-cta-dock">
          <div className="tm-cta-dock__inner">
            <button
              type="button"
              data-testid="technician-edit-completion-report"
              onClick={onStartFinishJob}
              className={ctaPillClass("primary")}
            >
              <Pencil className="h-5 w-5" aria-hidden />
              {t("technician_hub.dashboard.detail.edit_report")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryCtaKind =
    primary?.kind === "finish"
      ? "finish"
      : primary?.kind === "transition" && primary.toStatus === "in_progress"
        ? "amber"
        : primary?.kind === "transition"
          ? "blue"
          : "primary";

  return (
    <div
      data-testid="technician-mobile-mission"
      data-ui-version="field-v2"
      className="technician-field-screen relative flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="shrink-0 pt-3">
        <MissionStepTrack activeIndex={stepVisual.activeIndex} paused={stepVisual.paused} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-32">
        <article className="tm-hero">
          {hasExtraDetails ? (
            <button
              type="button"
              data-testid="technician-mobile-details-toggle"
              onClick={() => setDetailsOpen((v) => !v)}
              className="tm-info-fab"
              aria-label={t("technician_hub.dashboard.field_footer.more")}
            >
              <Info className="h-4 w-4" aria-hidden />
            </button>
          ) : null}

          <p data-testid="technician-mobile-mission-time" className="tm-hero__time">
            {presentation.timeLabel}
          </p>
          <h1 data-testid="technician-mobile-mission-client" className="tm-hero__name">
            {presentation.clientDisplayName}
          </h1>

          {presentation.address ? (
            presentation.addressMapsHref ? (
              <a
                href={presentation.addressMapsHref}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="technician-mobile-mission-address"
                className="tm-hero__address tm-hero__address-link"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span className="line-clamp-2">{presentation.address}</span>
              </a>
            ) : (
              <p data-testid="technician-mobile-mission-address" className="tm-hero__address">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span className="line-clamp-2">{presentation.address}</span>
              </p>
            )
          ) : null}

          {phone || mapsUrl ? (
            <div className="tm-quick-row">
              {phone ? (
                <a
                  href={`tel:${phone}`}
                  data-testid="technician-mobile-call"
                  className="tm-quick-btn tm-quick-btn--call"
                  aria-label={t("common.call")}
                >
                  <Phone className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </a>
              ) : null}
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="technician-mobile-navigate"
                  className="tm-quick-btn tm-quick-btn--nav"
                  aria-label={t("common.navigate")}
                >
                  <Navigation2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                </a>
              ) : null}
            </div>
          ) : null}
        </article>

        {detailsOpen && hasExtraDetails ? (
          <div data-testid="technician-mobile-details-panel" className="tm-details-sheet">
            {presentation.descriptionText ? (
              <p className="text-[15px] font-medium leading-relaxed text-zinc-800">
                {presentation.descriptionText}
              </p>
            ) : null}
            {liveIv.audioUrl ? (
              <audio
                controls
                src={liveIv.audioUrl}
                className="mt-3 w-full"
                data-testid="technician-mobile-audio"
              />
            ) : null}
            {liveIv.transcription?.trim() ? (
              <p className="mt-2 text-[14px] font-medium leading-snug text-zinc-600">
                {liveIv.transcription.trim()}
              </p>
            ) : null}
            {liveIv.status === "in_progress" && liveIv.reportRejectionReason?.trim() ? (
              <div data-testid="technician-report-rejected-banner" className="mt-3">
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

      {awaitingAssignment && technicianUid ? (
        <div className="tm-cta-dock" data-testid="mission-action-bar">
          <TechnicianMobileRespondBar
            iv={liveIv}
            technicianUid={technicianUid}
            onAccepted={onAssignmentAccepted}
            onDeclined={onAssignmentDeclined}
          />
        </div>
      ) : null}

      {showActionBar && primary ? (
        <div className="tm-cta-dock" data-testid="mission-action-bar">
          <div className="tm-cta-dock__inner">
            {liveIv.status === "in_progress" && actionConfig.canMaterials ? (
              <button
                type="button"
                data-testid="technician-waiting-material-btn"
                disabled={isUpdating}
                onClick={() => void handleUpdateStatus("waiting_material")}
                className="tm-cta-ghost"
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
                className={ctaPillClass("finish")}
              >
                {isUpdating ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Camera className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                )}
                {t(primary.labelKey)}
              </button>
            ) : (
              <button
                type="button"
                data-testid={primary.testId}
                disabled={isUpdating}
                onClick={() => void handleUpdateStatus(primary.toStatus)}
                className={ctaPillClass(primaryCtaKind)}
              >
                {isUpdating ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : primary.toStatus === "in_progress" ? (
                  <MapPin className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                ) : primary.toStatus === "en_route" ? (
                  <Navigation2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                ) : (
                  <Play className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                )}
                {t(primary.labelKey)}
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
