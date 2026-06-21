"use client";

import { useEffect, useMemo, useState } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { PLANNING_HUB_SLOT_INDEX } from "@/features/planningHub/planningHubConstants";
import PlanningHubTechnicianGrid from "@/features/planningHub/components/PlanningHubTechnicianGrid";
import PlanningHubSlotGrid from "@/features/planningHub/components/PlanningHubSlotGrid";
import PlanningHubRightPanel from "@/features/planningHub/components/PlanningHubRightPanel";
import { usePlanningHubData } from "@/features/planningHub/hooks/usePlanningHubData";
import {
  buildPlanningPendingRows,
  buildPlanningSlotsForTechnician,
  buildPlanningTechnicianRows,
  findInterventionById,
} from "@/features/planningHub/planningHubPatronMetrics";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = { slotIndex?: number };

const sideShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub planning — qui fait quoi aujourd'hui, en clair. */
export default function PlanningHubPage({ slotIndex = PLANNING_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { interventions, technicians, loading } = usePlanningHubData(companyId || null);

  const [selectedTechUid, setSelectedTechUid] = useState<string | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);

  const techRows = useMemo(
    () => buildPlanningTechnicianRows({ interventions, technicians }),
    [interventions, technicians]
  );
  const pendingRows = useMemo(() => buildPlanningPendingRows({ interventions }), [interventions]);

  useEffect(() => {
    if (techRows.length === 0) {
      setSelectedTechUid(null);
      return;
    }
    if (!selectedTechUid || !techRows.some((r) => r.uid === selectedTechUid)) {
      setSelectedTechUid(techRows[0]!.uid);
    }
  }, [techRows, selectedTechUid]);

  const selectedTech = techRows.find((r) => r.uid === selectedTechUid) ?? null;
  const slots = useMemo(
    () =>
      selectedTechUid
        ? buildPlanningSlotsForTechnician({ interventions, technicianUid: selectedTechUid })
        : [],
    [interventions, selectedTechUid]
  );

  useEffect(() => {
    setSelectedSlotTime(null);
  }, [selectedTechUid]);

  const selectedIntervention = useMemo(() => {
    if (!selectedSlotTime) return null;
    const slot = slots.find((s) => s.time === selectedSlotTime);
    return findInterventionById(interventions, slot?.interventionId);
  }, [selectedSlotTime, slots, interventions]);

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="planning-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="planning-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("planningHub.company_required")}
      </div>
    ) : null;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("planningHub.aria.page")} ${humanPage} — ${t("planningHub.aria.left")}`}
      centerAriaLabel={`${t("planningHub.aria.page")} ${humanPage} — ${t("planningHub.aria.center")}`}
      rightAriaLabel={`${t("planningHub.aria.page")} ${humanPage} — ${t("planningHub.aria.right")}`}
      mobileLeftLabel={String(t("planningHub.mobile.rail_left"))}
      mobileCenterLabel={String(t("planningHub.mobile.rail_center"))}
      mobileRightLabel={String(t("planningHub.mobile.rail_right"))}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell} data-testid="planning-hub-page">
          {gate}
          {companyId && !gate ? (
            <PlanningHubTechnicianGrid
              rows={techRows}
              loading={loading}
              selectedUid={selectedTechUid}
              onSelect={setSelectedTechUid}
            />
          ) : null}
        </section>
      }
      center={
        <section className={mainShell}>
          {gate}
          {companyId && !gate ? (
            selectedTech ? (
              <PlanningHubSlotGrid
                slots={slots}
                selectedSlotTime={selectedSlotTime}
                onSelectSlot={setSelectedSlotTime}
              />
            ) : (
              <div
                data-testid="planning-hub-no-tech"
                className="flex flex-1 items-center justify-center text-sm text-slate-400"
              >
                {t("planningHub.no_technicians")}
              </div>
            )
          ) : null}
        </section>
      }
      right={
        <section className={mainShell}>
          {companyId && !gate ? (
            <PlanningHubRightPanel
              selectedIntervention={selectedIntervention}
              pendingRows={pendingRows}
            />
          ) : null}
        </section>
      }
    />
  );
}
