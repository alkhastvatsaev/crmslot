"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import UnifiedInterventionDrawer, {
  type UnifiedDrawerTab,
} from "@/features/interventions/components/UnifiedInterventionDrawer";
import CaseHubDetailSectionMenu from "@/features/caseHub/components/CaseHubDetailSectionMenu";
import CaseHubDetailActions from "@/features/caseHub/components/CaseHubDetailActions";
import CaseHubDetailAudio from "@/features/caseHub/components/CaseHubDetailAudio";
import CaseHubDetailBilling from "@/features/caseHub/components/CaseHubDetailBilling";
import CaseHubDetailEquipment from "@/features/caseHub/components/CaseHubDetailEquipment";
import CaseHubDetailFacts from "@/features/caseHub/components/CaseHubDetailFacts";
import CaseHubDetailInsights from "@/features/caseHub/components/CaseHubDetailInsights";
import CaseHubDetailSummary from "@/features/caseHub/components/CaseHubDetailSummary";
import { buildCaseHubDetailSnapshot } from "@/features/caseHub/caseHubInterventionDetail";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useTechnicians } from "@/features/technicians/hooks";
import type { Intervention } from "@/features/interventions/types";
import { bucketForStatus } from "@/features/caseHub/caseHubPatronMetrics";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";

type Props = {
  intervention: Intervention | null;
  peerInterventions: Intervention[];
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  en_route: "bg-indigo-100 text-indigo-700 border-indigo-200",
  in_progress: "bg-violet-100 text-violet-700 border-violet-200",
  waiting_material: "bg-amber-100 text-amber-800 border-amber-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  invoiced: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  pending_needs_address: "bg-orange-100 text-orange-800 border-orange-200",
};

const NEXT_ACTION_TONE: Record<CaseHubBucket, string> = {
  to_assign: "bg-rose-50 border-rose-200 text-rose-900",
  in_progress: "bg-violet-50 border-violet-200 text-violet-900",
  waiting: "bg-amber-50 border-amber-200 text-amber-900",
  to_invoice: "bg-emerald-50 border-emerald-200 text-emerald-900",
  invoiced: "bg-green-50 border-green-200 text-green-900",
  cancelled: "bg-slate-50 border-slate-200 text-slate-700",
  all: "bg-slate-50 border-slate-200 text-slate-700",
};

const TAB_FOR_BUCKET: Record<CaseHubBucket, UnifiedDrawerTab> = {
  to_assign: "timeline",
  in_progress: "timeline",
  waiting: "materials",
  to_invoice: "billing",
  invoiced: "billing",
  cancelled: "timeline",
  all: "timeline",
};

export default function CaseHubRightPanel({ intervention, peerInterventions }: Props) {
  const { t } = useTranslation();
  const { technicians } = useTechnicians();
  const [drawerTab, setDrawerTab] = useState<UnifiedDrawerTab>("timeline");

  useEffect(() => {
    if (!intervention) return;
    setDrawerTab(TAB_FOR_BUCKET[bucketForStatus(intervention.status)]);
  }, [intervention?.id]);

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
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div
          data-testid="case-hub-empty-detail"
          className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center text-[12px] text-slate-400"
        >
          {t("caseHub.pick_case")}
        </div>
      </div>
    );
  }

  const snapshot = buildCaseHubDetailSnapshot(intervention, peerInterventions);
  const status = intervention.status ?? "pending";
  const bucket = bucketForStatus(status);
  const statusLabel = t(`caseHub.status.${status}` as "caseHub.status.pending");
  const nextAction = t(`caseHub.next_action.${status}` as "caseHub.next_action.pending");
  const defaultTab = TAB_FOR_BUCKET[bucket];

  return (
    <div
      data-testid="case-hub-right-panel"
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        <CaseHubDetailSummary
          intervention={intervention}
          snapshot={snapshot}
          techName={techName}
          statusLabel={statusLabel}
          statusBadgeClass={STATUS_BADGE[status] ?? STATUS_BADGE.pending}
        />

        <CaseHubDetailInsights insights={snapshot.insights} />

        <CaseHubDetailActions
          intervention={intervention}
          peerInterventions={peerInterventions}
          snapshot={snapshot}
        />

        <CaseHubDetailSectionMenu
          interventionId={intervention.id}
          activeTab={drawerTab}
          onTabChange={setDrawerTab}
          tabBadges={snapshot.drawerTabBadges}
        />

        <div className="shrink-0 border-b border-black/[0.05] bg-white px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("caseHub.right.next")}
          </p>
          <div
            data-testid="case-hub-next-action"
            className={cn(
              "mt-1 flex items-center gap-2 rounded-2xl border px-3 py-2.5",
              NEXT_ACTION_TONE[bucket]
            )}
          >
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-[14px] font-bold">{nextAction}</span>
          </div>
        </div>

        <CaseHubDetailAudio intervention={intervention} hasAudio={snapshot.hasAudio} />
        <CaseHubDetailBilling intervention={intervention} />
        <CaseHubDetailFacts intervention={intervention} />
        <CaseHubDetailEquipment intervention={intervention} />

        <div className="px-3 pb-3 pt-2">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("caseHub.right.details")}
          </p>
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
            className="min-h-[360px] border-0 bg-transparent shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
