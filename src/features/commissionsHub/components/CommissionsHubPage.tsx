"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";
import CommissionsHubRevenuePanel from "@/features/commissionsHub/components/CommissionsHubRevenuePanel";
import CommissionsHubDistributionPanel from "@/features/commissionsHub/components/CommissionsHubDistributionPanel";
import CommissionsHubRulesPanel from "@/features/commissionsHub/components/CommissionsHubRulesPanel";
import { useCommissionsHubData } from "@/features/commissionsHub/hooks/useCommissionsHubData";
import {
  buildPatronCommissionKpis,
  buildPatronMonthlySeries,
  buildPatronTechnicianRows,
  buildPatronTrend,
  resolveTechnicianPayablePreviewCents,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import type { CommissionsHubSelection } from "@/features/commissionsHub/commissionsHubTypes";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import { useTechnicians } from "@/features/technicians/hooks";
import { useCompanyStaff } from "@/features/teamHub";
import { prefetchCompanyStaff } from "@/features/teamHub/companyStaffCache";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useHubPageActive } from "@/features/dashboard/hooks/useHubPageActive";

type Props = { slotIndex?: number };

const sideShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub commissions — pipeline lecture gauche→droite : 1. Encaisser · 2. Distribuer · 3. Régler. */
export default function CommissionsHubPage({ slotIndex = COMMISSIONS_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const pageActive = useHubPageActive(slotIndex);
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { technicians, loading: techniciansLoading } = useTechnicians();
  const { staff } = useCompanyStaff(pageActive ? companyId : null);

  useEffect(() => {
    if (pageActive && companyId) prefetchCompanyStaff(companyId);
  }, [pageActive, companyId]);

  const [selection, setSelection] = useState<CommissionsHubSelection>({ kind: "none" });
  const [pendingRateByUid, setPendingRateByUid] = useState<Record<string, number>>({});

  const handlePendingRateChange = useCallback((uid: string, value: number) => {
    setPendingRateByUid((prev) => ({ ...prev, [uid]: value }));
  }, []);

  const handlePendingRateClear = useCallback((uid: string) => {
    setPendingRateByUid((prev) => {
      if (!(uid in prev)) return prev;
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  }, []);

  const { rules, interventions, manualEntries, rulesLoading, manualLoading, saveTechnicianRate } =
    useCommissionsHubData(pageActive ? companyId || null : null, technicians);

  const patronKpis = useMemo(
    () => buildPatronCommissionKpis({ interventions, manualEntries, rules }),
    [interventions, manualEntries, rules]
  );

  const monthlySeries = useMemo(
    () => buildPatronMonthlySeries({ interventions, manualEntries, months: 6 }),
    [interventions, manualEntries]
  );

  const revenueTrend = useMemo(
    () => buildPatronTrend(monthlySeries, "revenueCents"),
    [monthlySeries]
  );

  const technicianRows = useMemo(() => {
    if (!companyId) return [];
    return buildPatronTechnicianRows({
      interventions,
      manualEntries,
      rules,
      companyId,
      technicians,
      staffMembers: staff,
    });
  }, [companyId, interventions, manualEntries, rules, technicians, staff]);

  const totalPayableCents = useMemo(
    () =>
      technicianRows.reduce(
        (sum, row) => sum + resolveTechnicianPayablePreviewCents(row, pendingRateByUid[row.uid]),
        0
      ),
    [technicianRows, pendingRateByUid]
  );

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="commissions-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="commissions-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("commissionsHub.company_required")}
      </div>
    ) : null;

  const selectedTechUid = selection.kind === "technician" ? selection.uid : null;
  const teamLoading = techniciansLoading || rulesLoading || manualLoading;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("commissionsHub.aria.page")} ${humanPage} — ${t("commissionsHub.aria.left")}`}
      centerAriaLabel={`${t("commissionsHub.aria.page")} ${humanPage} — ${t("commissionsHub.aria.center")}`}
      rightAriaLabel={`${t("commissionsHub.aria.page")} ${humanPage} — ${t("commissionsHub.aria.right")}`}
      mobileLeftLabel={String(t("commissionsHub.mobile.rail_left"))}
      mobileCenterLabel={String(t("commissionsHub.mobile.rail_center"))}
      mobileRightLabel={String(t("commissionsHub.mobile.rail_right"))}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell} data-testid="commissions-hub-page">
          {gate}
          {companyId && !gate ? (
            <CommissionsHubRevenuePanel
              revenueCents={patronKpis.monthRevenueCents}
              revenueTrend={revenueTrend}
              series={monthlySeries}
              technicianCount={patronKpis.activeTechnicianCount}
            />
          ) : null}
        </section>
      }
      center={
        <section className={mainShell}>
          {gate}
          {companyId && !gate ? (
            <CommissionsHubDistributionPanel
              rows={technicianRows}
              loading={teamLoading}
              selectedUid={selectedTechUid}
              pendingRateByUid={pendingRateByUid}
              onSelect={(uid) => setSelection({ kind: "technician", uid })}
              totalCents={totalPayableCents}
            />
          ) : null}
        </section>
      }
      right={
        <section className={mainShell}>
          {companyId && !gate ? (
            <CommissionsHubRulesPanel
              selection={selection}
              technicianRows={technicianRows}
              pendingRateByUid={pendingRateByUid}
              onPendingRateChange={handlePendingRateChange}
              onPendingRateClear={handlePendingRateClear}
              onSelectionChange={setSelection}
              onSaveTechnicianRate={saveTechnicianRate}
            />
          ) : null}
        </section>
      }
    />
  );
}
