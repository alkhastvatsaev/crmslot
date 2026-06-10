"use client";

import { useMemo } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import BillingHubCenterPanel from "@/features/billingHub/components/BillingHubCenterPanel";
import BillingHubAgentPanel from "@/features/billingHub/components/BillingHubAgentPanel";
import ChatbotRightRail from "@/features/chatbot/components/ChatbotRightRail";
import QuoteListPanel from "@/features/quotes/components/QuoteListPanel";
import MaintenanceContractPanel from "@/features/maintenance/components/MaintenanceContractPanel";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { computeBillingHubMetrics } from "@/features/billingHub/billingHubMetrics";
import { useCompanyBillingInterventions } from "@/features/billingHub/hooks/useCompanyBillingInterventions";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

type Props = { slotIndex?: number };

const assistShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden p-3 ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const documentsRailShell = `flex min-h-0 flex-1 flex-col ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub facturation — centre = liste · gauche = agent · droite = documents (même rail que Chatbot). */
export default function BillingHubPage({ slotIndex = BILLING_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const pager = useDashboardPagerOptional();
  const pageActive = pager == null || pager.pageIndex === slotIndex;
  const companyId =
    (workspace?.activeCompanyId ?? "").trim() || (workspace?.isTenantUser ? DEMO_COMPANY_ID : "");

  const { interventions, loading, isPreviewCatalog } = useCompanyBillingInterventions(
    companyId || null
  );

  const metrics = useMemo(() => computeBillingHubMetrics(interventions), [interventions]);

  const gate = !companyId ? (
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
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={assistShell}>
          {companyId ? (
            <BillingHubAgentPanel
              companyId={companyId}
              interventions={interventions}
              metrics={metrics}
              loading={loading}
              pageActive={pageActive}
            />
          ) : null}
          <div className="custom-scrollbar overflow-y-auto space-y-4 pb-2">
            <QuoteListPanel />
            <MaintenanceContractPanel />
          </div>
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
        <section className={documentsRailShell} data-testid="billing-hub-documents-rail">
          <ChatbotRightRail />
        </section>
      }
    />
  );
}
