"use client";

import { useEffect, useMemo, useState } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { CASE_HUB_SLOT_INDEX } from "@/features/caseHub/caseHubConstants";
import CaseHubGrid from "@/features/caseHub/components/CaseHubGrid";
import CaseHubRightPanel from "@/features/caseHub/components/CaseHubRightPanel";
import {
  buildCaseHubKpis,
  filterCaseInterventions,
  sortCaseInterventions,
} from "@/features/caseHub/caseHubPatronMetrics";
import type { CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";
import { useBackOfficeInterventions } from "@/features/backoffice/useBackOfficeInterventions";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { PatronHubChipRow, PatronHubGuide } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = { slotIndex?: number };

type CaseView = "open" | "done";

const sideShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub dossiers — quelles affaires sont en cours, en clair. */
export default function CaseHubPage({ slotIndex = CASE_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { interventions, loading } = useBackOfficeInterventions(companyId || null);

  const [view, setView] = useState<CaseView>("open");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(() => sortCaseInterventions(interventions), [interventions]);
  const kpis = useMemo(() => buildCaseHubKpis({ interventions: sorted }), [sorted]);
  const filter: CaseHubStatusFilter = view;
  const filtered = useMemo(
    () => sortCaseInterventions(filterCaseInterventions(sorted, filter)),
    [sorted, filter]
  );

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filtered.some((iv) => iv.id === selectedId)) {
      setSelectedId(filtered[0]!.id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((iv) => iv.id === selectedId) ?? null;

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="case-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="case-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("caseHub.company_required")}
      </div>
    ) : null;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("caseHub.aria.page")} ${humanPage} — ${t("caseHub.aria.left")}`}
      centerAriaLabel={`${t("caseHub.aria.page")} ${humanPage} — ${t("caseHub.aria.center")}`}
      rightAriaLabel={`${t("caseHub.aria.page")} ${humanPage} — ${t("caseHub.aria.right")}`}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell} data-testid="case-hub-page">
          {gate}
          {companyId && !gate ? (
            <>
              <PatronHubGuide
                value={String(kpis.openCount)}
                label={t("caseHub.guide.value_label")}
                hint={t("caseHub.guide.hint")}
                valueTestId="case-hub-kpi-open"
                rootTestId="case-hub-kpi-strip"
              />
              <PatronHubChipRow
                testId="case-hub-view-chips"
                value={view}
                onChange={(id) => setView(id as CaseView)}
                options={[
                  {
                    id: "open",
                    label: t("caseHub.guide.chip_open"),
                    testId: "case-hub-filter-open",
                  },
                  {
                    id: "done",
                    label: t("caseHub.guide.chip_done"),
                    testId: "case-hub-filter-done",
                  },
                ]}
              />
            </>
          ) : null}
        </section>
      }
      center={
        <section className={mainShell}>
          {gate}
          {companyId && !gate ? (
            <CaseHubGrid
              interventions={filtered}
              loading={loading}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          ) : null}
        </section>
      }
      right={
        <section className={mainShell}>
          {companyId && !gate ? <CaseHubRightPanel intervention={selected} /> : null}
        </section>
      }
    />
  );
}
