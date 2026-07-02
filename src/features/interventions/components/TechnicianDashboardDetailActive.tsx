"use client";

import { AlertTriangle } from "lucide-react";
import type { Intervention } from "@/features/interventions/types";
import type { MissionContactAction } from "@/features/interventions/components/MissionContactRail";
import MissionContactRail from "@/features/interventions/components/MissionContactRail";
import MissionFieldFooter from "@/features/interventions/components/MissionFieldFooter";
import TechnicianMissionBrief from "@/features/interventions/components/TechnicianMissionBrief";
import TechnicianAssignmentRespondBar from "@/features/interventions/components/TechnicianAssignmentRespondBar";
import TechnicianEarlyStartPrompt from "@/features/interventions/components/TechnicianEarlyStartPrompt";
import TechnicianDashboardAudioPlayer from "@/features/interventions/components/TechnicianDashboardAudioPlayer";
import { formatScheduledTimeOnly } from "@/features/interventions/technicianSchedule";
import { formatAddress } from "@/utils/stringUtils";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import MissionKitPanel from "@/features/missionKit/components/MissionKitPanel";
import { useMissionKit } from "@/features/missionKit/hooks/useMissionKit";
import { useMissionKitChecklist } from "@/features/missionKit/hooks/useMissionKitChecklist";
import { shouldShowMissionKitMissingWarning } from "@/features/missionKit/missionKitChecklistFirestore";
import { useMissionKitMaterialOrder } from "@/features/missionKit/hooks/useMissionKitMaterialOrder";

export default function TechnicianDashboardDetailActive({
  liveIv,
  caseId,
  technicianUid,
  clientDisplayName,
  descriptionText,
  addressMapsHref,
  hasAudioBlock,
  awaitingAssignment,
  showActionBar,
  showEarlyStartPrompt,
  isUpdating,
  primaryContactActions,
  onAssignmentAccepted,
  onAssignmentDeclined,
  onEarlyStartConfirm,
  onEarlyStartDismiss,
  onUpdateStatus,
  onStartFinishJob,
}: {
  liveIv: Intervention;
  caseId: string;
  technicianUid: string;
  clientDisplayName: string;
  descriptionText: string | null;
  addressMapsHref: string | null;
  hasAudioBlock: boolean;
  awaitingAssignment: boolean;
  showActionBar: boolean;
  showEarlyStartPrompt: boolean;
  isUpdating: boolean;
  primaryContactActions: MissionContactAction[];
  onAssignmentAccepted?: (next: Intervention) => void;
  onAssignmentDeclined?: () => void;
  onEarlyStartConfirm: () => void;
  onEarlyStartDismiss: () => void;
  onUpdateStatus: (status: Intervention["status"], note?: string) => Promise<void>;
  onStartFinishJob: () => void;
}) {
  const { t } = useTranslation();
  const missionKitEnabled = useFeatureFlag("missionKit");
  const missionKit = useMissionKit({
    enabled: missionKitEnabled,
    intervention: liveIv,
    technicianUid,
  });
  const checklist = useMissionKitChecklist({
    enabled: missionKitEnabled && Boolean(technicianUid),
    interventionId: liveIv.id,
    technicianUid,
    initialCheckedIds: liveIv.missionKitCheckedItemIds,
  });
  const materialOrder = useMissionKitMaterialOrder({
    enabled: missionKitEnabled && Boolean(technicianUid),
    intervention: liveIv,
    technicianUid,
  });
  const showKitWarning = shouldShowMissionKitMissingWarning(liveIv.status, missionKit.missingCount);

  return (
    <>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          awaitingAssignment && "technician-detail-awaiting-offer"
        )}
        data-testid={
          liveIv.status === "waiting_material" ? "technician-detail-waiting-material" : undefined
        }
      >
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
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

            {missionKitEnabled ? (
              <MissionKitPanel
                kit={missionKit.kit}
                loading={missionKit.loading}
                interactive={!awaitingAssignment && liveIv.status !== "in_progress"}
                checkedItemIds={checklist.checkedItemIds}
                onToggleItem={checklist.toggleItem}
                showMissingWarning={showKitWarning}
                onOrderItem={(item) => void materialOrder.orderItem(item)}
                orderingItemId={materialOrder.orderingItemId}
                orderedItemIds={materialOrder.orderedItemIds}
              />
            ) : null}

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
                {liveIv.audioUrl ? (
                  <TechnicianDashboardAudioPlayer url={liveIv.audioUrl} t={t} />
                ) : null}
                {liveIv.transcription?.trim() ? (
                  <p className="line-clamp-3 text-[12px] font-semibold leading-snug text-slate-800">
                    {liveIv.transcription.trim()}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {showEarlyStartPrompt ? (
            <TechnicianEarlyStartPrompt
              intervention={liveIv}
              awaitingAssignment={awaitingAssignment}
              isUpdating={isUpdating}
              onConfirm={onEarlyStartConfirm}
              onDismiss={onEarlyStartDismiss}
            />
          ) : null}
        </div>
      </div>

      {awaitingAssignment && technicianUid && !showEarlyStartPrompt ? (
        <TechnicianAssignmentRespondBar
          iv={liveIv}
          technicianUid={technicianUid}
          onAccepted={onAssignmentAccepted}
          onDeclined={onAssignmentDeclined}
        />
      ) : null}

      {showActionBar && !showEarlyStartPrompt ? (
        <MissionFieldFooter
          intervention={liveIv}
          isUpdating={isUpdating}
          onPrimaryTransition={(toStatus) => void onUpdateStatus(toStatus)}
          onFinish={onStartFinishJob}
          onWaitingMaterial={() => void onUpdateStatus("waiting_material")}
        />
      ) : null}
    </>
  );
}
