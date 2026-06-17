"use client";

import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
import TeamStaffListPanel from "@/features/teamHub/components/TeamStaffListPanel";
import { useCompanyStaff } from "@/features/teamHub/hooks/useCompanyStaff";
import { DASHBOARD_DESKTOP_PANEL_GAP_CLASS } from "@/core/ui/dashboardDesktopLayout";

type Props = { slotIndex?: number };

const centerShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub équipe — liste et gestion des employés de la société active. */
export default function TeamHubPage({ slotIndex = TEAM_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);
  const { staff, loading, error, refresh } = useCompanyStaff(companyId);

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
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      centerAriaLabel={`${t("teamHub.aria.page")} ${humanPage}`}
      centerPadding={false}
      center={
        <section className={centerShell} data-testid="team-hub-page">
          {gate}
          {companyId && !gate ? (
            <TeamStaffListPanel
              companyId={companyId}
              staff={staff}
              loading={loading}
              loadError={error}
              onRefresh={refresh}
            />
          ) : null}
        </section>
      }
    />
  );
}
