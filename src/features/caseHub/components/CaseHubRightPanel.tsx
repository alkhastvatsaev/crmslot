"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { HUB_SURFACE } from "@/core/ui/hub";
import UnifiedInterventionDrawer, {
  type UnifiedDrawerTab,
} from "@/features/interventions/components/UnifiedInterventionDrawer";
import CaseHubDetailSectionMenu from "@/features/caseHub/components/CaseHubDetailSectionMenu";
import CaseHubDetailActions from "@/features/caseHub/components/CaseHubDetailActions";
import CaseHubDetailDashboard from "@/features/caseHub/components/CaseHubDetailDashboard";
import CaseHubDetailMedia from "@/features/caseHub/components/CaseHubDetailMedia";
import CaseHubDetailPulse from "@/features/caseHub/components/CaseHubDetailPulse";
import CaseHubDetailSituation from "@/features/caseHub/components/CaseHubDetailSituation";
import CaseHubDetailStep from "@/features/caseHub/components/CaseHubDetailStep";
import { CASE_HUB_DETAIL } from "@/features/caseHub/caseHubDetailTheme";
import { buildCaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetail";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicians } from "@/features/technicians/hooks";
import type { Intervention } from "@/features/interventions/types";
import { bucketForIntervention } from "@/features/caseHub/caseHubPatronMetrics";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";

type Props = {
  intervention: Intervention | null;
  peerInterventions: Intervention[];
};

const TAB_FOR_BUCKET: Record<CaseHubBucket, UnifiedDrawerTab> = {
  to_assign: "timeline",
  in_progress: "timeline",
  waiting: "materials",
  to_invoice: "billing",
  invoiced: "billing",
  paid: "billing",
  cancelled: "timeline",
  all: "timeline",
};

export default function CaseHubRightPanel({ intervention, peerInterventions }: Props) {
  const { t } = useTranslation();
  const { technicians } = useTechnicians();
  const [drawerTab, setDrawerTab] = useState<UnifiedDrawerTab>("timeline");

  useEffect(() => {
    if (!intervention) return;
    setDrawerTab(TAB_FOR_BUCKET[bucketForIntervention(intervention)]);
  }, [intervention?.id, intervention?.paymentStatus, intervention?.status]);

  const techName = useMemo(() => {
    const uid = intervention?.assignedTechnicianUid?.trim();
    if (!uid) return null;
    const found = technicians.find((tech) => (tech.authUid ?? tech.id) === uid);
    return found?.name ?? null;
  }, [intervention?.assignedTechnicianUid, technicians]);

  if (!intervention) {
    return (
      <div
        data-testid="case-hub-right-panel"
        className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", CASE_HUB_DETAIL.panel)}
      >
        <CaseHubDetailDashboard interventions={peerInterventions} />
      </div>
    );
  }

  const snapshot = buildCaseHubDetailSnapshot(intervention, peerInterventions);
  const status = intervention.status ?? "pending";
  const bucket = bucketForIntervention(intervention);
  const statusLabel = t(`caseHub.status.${status}` as "caseHub.status.pending");
  const nextAction =
    bucket === "paid"
      ? t("caseHub.next_action.paid")
      : t(`caseHub.next_action.${status}` as "caseHub.next_action.pending");
  const defaultTab = TAB_FOR_BUCKET[bucket];

  return (
    <div
      data-testid="case-hub-right-panel"
      className={cn("flex min-h-0 flex-1 flex-col overflow-hidden", CASE_HUB_DETAIL.panel)}
    >
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
        <CaseHubDetailSituation
          intervention={intervention}
          snapshot={snapshot}
          statusLabel={statusLabel}
          nextAction={nextAction}
        />

        <CaseHubDetailPulse snapshot={snapshot} techName={techName} />

        <CaseHubDetailActions
          intervention={intervention}
          peerInterventions={peerInterventions}
          snapshot={snapshot}
        />

        <CaseHubDetailStep step={4} title={t("caseHub.pipeline.step_detail")}>
          <CaseHubDetailSectionMenu
            interventionId={intervention.id}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            tabBadges={snapshot.drawerTabBadges}
          />
          <div className="mt-3">
            <UnifiedInterventionDrawer
              key={intervention.id}
              intervention={intervention}
              technicianUid={intervention.assignedTechnicianUid ?? ""}
              allowMaterialCreate
              allowMaterialStatusUpdate
              defaultTab={defaultTab}
              activeTab={drawerTab}
              onTabChange={setDrawerTab}
              tabBadges={snapshot.drawerTabBadges}
              hideTabBar
              emailVariant="patron"
              defaultComposeTo={snapshot.email}
              className={cn(
                CASE_HUB_DETAIL.drawerCard,
                HUB_SURFACE.cardMuted,
                "min-h-[280px] border-0 bg-slate-50/40 shadow-none"
              )}
            />
          </div>
        </CaseHubDetailStep>

        <CaseHubDetailMedia intervention={intervention} hasAudio={snapshot.hasAudio} />
      </div>
    </div>
  );
}
