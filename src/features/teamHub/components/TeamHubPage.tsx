"use client";

import { useMemo, useState } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
import TeamHubStaffGrid from "@/features/teamHub/components/TeamHubStaffGrid";
import TeamHubRightPanel from "@/features/teamHub/components/TeamHubRightPanel";
import { useCompanyStaff } from "@/features/teamHub/hooks/useCompanyStaff";
import { buildTeamHubKpis, filterTeamStaff } from "@/features/teamHub/teamHubPatronMetrics";
import type { TeamHubStaffFilter } from "@/features/teamHub/teamHubTypes";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { PatronHubChipRow, PatronHubGuide } from "@/core/ui/hub";

type Props = { slotIndex?: number };

type TeamView = "active" | "all";

const sideShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub équipe — qui travaille chez moi, en clair. */
export default function TeamHubPage({ slotIndex = TEAM_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { staff, loading, error, refresh } = useCompanyStaff(companyId);

  const [view, setView] = useState<TeamView>("active");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const kpis = useMemo(() => buildTeamHubKpis(staff), [staff]);
  const filter: TeamHubStaffFilter = view === "active" ? "active" : "all";
  const filteredStaff = useMemo(() => filterTeamStaff(staff, filter), [staff, filter]);

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="team-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="team-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("teamHub.company_required")}
      </div>
    ) : null;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("teamHub.aria.page")} ${humanPage} — ${t("teamHub.aria.left")}`}
      centerAriaLabel={`${t("teamHub.aria.page")} ${humanPage} — ${t("teamHub.aria.center")}`}
      rightAriaLabel={`${t("teamHub.aria.page")} ${humanPage} — ${t("teamHub.aria.right")}`}
      mobileLeftLabel={String(t("teamHub.mobile.rail_left"))}
      mobileCenterLabel={String(t("teamHub.mobile.rail_center"))}
      mobileRightLabel={String(t("teamHub.mobile.rail_right"))}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={sideShell} data-testid="team-hub-page">
          {gate}
          {companyId && !gate ? (
            <>
              <PatronHubGuide
                value={String(kpis.activeCount)}
                label={t("teamHub.guide.value_label")}
                hint={t("teamHub.guide.hint")}
                valueTestId="team-hub-kpi-active"
                rootTestId="team-hub-kpi-strip"
              />
              <PatronHubChipRow
                testId="team-hub-view-chips"
                value={view}
                onChange={(id) => setView(id as TeamView)}
                options={[
                  {
                    id: "active",
                    label: t("teamHub.guide.chip_active"),
                    testId: "team-hub-filter-active",
                  },
                  {
                    id: "all",
                    label: t("teamHub.guide.chip_all"),
                    testId: "team-hub-filter-all",
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
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {error ? (
                <div
                  role="alert"
                  data-testid="team-staff-load-error"
                  className="mx-3 mt-2 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
                >
                  {error}
                </div>
              ) : null}
              <TeamHubStaffGrid
                staff={filteredStaff}
                loading={loading}
                selectedUid={selectedUid}
                onSelect={setSelectedUid}
              />
            </div>
          ) : null}
        </section>
      }
      right={
        <section className={mainShell}>
          {companyId && !gate ? (
            <TeamHubRightPanel
              companyId={companyId}
              staff={staff}
              selectedUid={selectedUid}
              onClearSelection={() => setSelectedUid(null)}
              onRefresh={refresh}
            />
          ) : null}
        </section>
      }
    />
  );
}
