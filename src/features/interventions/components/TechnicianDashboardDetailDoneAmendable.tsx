"use client";

import { CheckCircle2, Pencil } from "lucide-react";
import type { QueryClient } from "@tanstack/react-query";
import MissionContactRail from "@/features/interventions/components/MissionContactRail";
import TechnicianMissionBrief from "@/features/interventions/components/TechnicianMissionBrief";
import TechnicianFinishInvoiceStep from "@/features/interventions/components/TechnicianFinishInvoiceStep";
import { formatScheduledTimeOnly } from "@/features/interventions/technicianSchedule";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import type { Intervention } from "@/features/interventions/types";
import type { MissionContactAction } from "@/features/interventions/components/MissionContactRail";
import { formatAddress } from "@/utils/stringUtils";
import { cn } from "@/lib/utils";
import { TERRAIN_BTN } from "@/features/interventions/terrainMobileChrome";
import { HubButton } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";

export default function TechnicianDashboardDetailDoneAmendable({
  caseId,
  liveIv,
  technicianUid,
  queryClient,
  clientDisplayName,
  descriptionText,
  addressMapsHref,
  primaryContactActions,
  onStartFinishJob,
}: {
  caseId: string;
  liveIv: Intervention;
  technicianUid: string;
  queryClient: QueryClient;
  clientDisplayName: string;
  descriptionText: string | null;
  addressMapsHref: string | null;
  primaryContactActions: MissionContactAction[];
  onStartFinishJob: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
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

      <div
        data-testid="technician-detail-scroll"
        className="technician-detail-body mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden px-4"
      >
        <TechnicianFinishInvoiceStep
          interventionId={caseId}
          clientEmail={liveIv.clientEmail}
          clientName={liveIv.clientName}
          onSent={() => {
            patchTechnicianAssignmentInCache(queryClient, technicianUid, caseId, {
              status: "invoiced",
              statusUpdatedAt: new Date().toISOString(),
            });
          }}
        />
      </div>

      <footer className="shrink-0 border-t border-slate-200/50 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <HubButton
          type="button"
          data-testid="technician-edit-completion-report"
          onClick={onStartFinishJob}
          fullWidth
          className={cn("mx-auto h-12 max-w-[20.5rem] text-[13px] font-semibold", TERRAIN_BTN)}
        >
          <Pencil className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
          {t("technician_hub.dashboard.detail.edit_report")}
        </HubButton>
      </footer>
    </>
  );
}
