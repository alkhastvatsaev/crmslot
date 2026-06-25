"use client";

import { useMemo } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import BillingHubAgentPanel from "@/features/billingHub/components/BillingHubAgentPanel";
import BillingHubCenterPanel from "@/features/billingHub/components/BillingHubCenterPanel";
import BillingHubRightPanel from "@/features/billingHub/components/BillingHubRightPanel";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { computeBillingHubMetrics } from "@/features/billingHub/billingHubMetrics";
import { useCompanyBillingInterventions } from "@/features/billingHub/hooks/useCompanyBillingInterventions";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
import { useHubPageActive } from "@/features/dashboard/hooks/useHubPageActive";

type Props = { slotIndex?: number };

const agentShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-3 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const documentsRailShell = `flex min-h-0 flex-1 flex-col ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub facturation — gauche = agent chatbot · centre = liste · droite = documents PDF. */
export default function BillingHubPage({ slotIndex = BILLING_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const pageActive = useHubPageActive(slotIndex);
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);

  const { interventions, loading, isPreviewCatalog } = useCompanyBillingInterventions(
    pageActive ? companyId || null : null
  );

  const metrics = useMemo(() => computeBillingHubMetrics(interventions), [interventions]);

  const gate =
    companyPhase === "loading" ? (
      <div
        data-testid="billing-hub-loading"
        className="flex min-h-0 flex-1 items-center justify-center px-6"
        aria-busy="true"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    ) : companyPhase === "missing" ? (
      <div
        data-testid="billing-hub-gate"
        className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-[13px] text-amber-800"
      >
        {t("billingHub.company_required")}
      </div>
    ) : null;

  return (
    <AdaptiveTriplePanelLayout
      rootTestId={`dashboard-pager-slot-${slotIndex}`}
      leftTestId={`dashboard-pager-slot-${slotIndex}-panel-left`}
      centerTestId={`dashboard-pager-slot-${slotIndex}-panel-center`}
      rightTestId={`dashboard-pager-slot-${slotIndex}-panel-right`}
      leftAriaLabel={`${t("billingHub.aria.page")} ${humanPage} — ${t("billingHub.aria.left")}`}
      centerAriaLabel={`${t("billingHub.aria.page")} ${humanPage} — ${t("billingHub.aria.center")}`}
      rightAriaLabel={`${t("billingHub.aria.page")} ${humanPage} — ${t("billingHub.aria.right")}`}
      mobileLeftLabel={String(t("billingHub.mobile.rail_left"))}
      mobileCenterLabel={String(t("billingHub.mobile.rail_center"))}
      mobileRightLabel={String(t("billingHub.mobile.rail_right"))}
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={agentShell} data-testid="billing-hub-chatbot-rail">
          {companyId ? (
            <BillingHubAgentPanel
              companyId={companyId}
              interventions={interventions}
              metrics={metrics}
              loading={loading}
              pageActive={pageActive}
            />
          ) : null}
        </section>
      }
      center={
        <section className={mainShell}>
          {gate ?? (
            <BillingHubCenterPanel
              interventions={interventions}
              isPreviewCatalog={isPreviewCatalog}
              loading={loading}
            />
          )}
        </section>
      }
      right={
        <section
          className={`${documentsRailShell} min-h-0 overflow-hidden`}
          data-testid="billing-hub-documents-rail"
        >
          <BillingHubRightPanel interventions={interventions} loading={loading} />
        </section>
      }
    />
  );
}
