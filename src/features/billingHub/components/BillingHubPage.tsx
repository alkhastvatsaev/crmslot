"use client";

import { useMemo } from "react";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import BillingHubCenterPanel from "@/features/billingHub/components/BillingHubCenterPanel";
import BillingHubAgentPanel from "@/features/billingHub/components/BillingHubAgentPanel";
import BillingHubRightAssistPanel from "@/features/billingHub/components/BillingHubRightAssistPanel";
import ChatbotRightRail from "@/features/chatbot/components/ChatbotRightRail";
import CompanyBillingSettingsPanel from "@/features/company/components/CompanyBillingSettingsPanel";
import WebhookEndpointsPanel from "@/features/integrations/components/WebhookEndpointsPanel";
import BiReportsPanel from "@/features/analytics/components/BiReportsPanel";
import CarouselUsagePanel from "@/features/analytics/components/CarouselUsagePanel";
import NotificationPreferencesPanel from "@/features/notifications/components/NotificationPreferencesPanel";
import PayrollExportButton from "@/features/timetracking/components/PayrollExportButton";
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
            <CarouselUsagePanel />
            <BiReportsPanel interventions={interventions} />
            <div data-testid="billing-hub-payroll-export">
              <PayrollExportButton scope="company" />
            </div>
            <CompanyBillingSettingsPanel />
            <WebhookEndpointsPanel />
            <NotificationPreferencesPanel profileKind="staff" />
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
        <section
          className={`${documentsRailShell} min-h-0 overflow-hidden`}
          data-testid="billing-hub-documents-rail"
        >
          {companyId ? (
            <div className="custom-scrollbar min-h-0 max-h-[45%] shrink-0 overflow-y-auto border-b border-slate-100 p-3">
              <BillingHubRightAssistPanel interventions={interventions} loading={loading} />
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatbotRightRail />
          </div>
        </section>
      }
    />
  );
}
