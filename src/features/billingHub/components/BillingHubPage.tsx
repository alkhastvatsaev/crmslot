"use client";

import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import BillingHubCenterPanel from "@/features/billingHub/components/BillingHubCenterPanel";
import ChatbotRightRail from "@/features/chatbot/components/ChatbotRightRail";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { useCompanyBillingInterventions } from "@/features/billingHub/hooks/useCompanyBillingInterventions";
import {
  DASHBOARD_DESKTOP_PANEL_GAP_CLASS,
  dashboardTripleSideOpaqueShellClass,
} from "@/core/ui/dashboardDesktopLayout";
import { useTranslation } from "@/core/i18n/I18nContext";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";

type Props = { slotIndex?: number };

const chatbotShell = `flex min-h-0 flex-1 flex-col overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;
const mainShell = `flex min-h-0 flex-1 flex-col scroll-mt-2 overflow-hidden ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

/** Hub facturation — gauche = chatbot · centre = liste · droite vide. */
export default function BillingHubPage({ slotIndex = BILLING_HUB_SLOT_INDEX }: Props) {
  const humanPage = slotIndex + 1;
  const { t } = useTranslation();
  const workspace = useCompanyWorkspaceOptional();
  const { companyId, phase: companyPhase } = resolveHubCompanyId(workspace);

  const { interventions, loading, isPreviewCatalog } = useCompanyBillingInterventions(
    companyId || null
  );

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
      centerPadding={false}
      rightPadding={false}
      leftShellClassName={dashboardTripleSideOpaqueShellClass}
      left={
        <section className={chatbotShell} data-testid="billing-hub-chatbot-rail">
          <ChatbotRightRail />
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
          className="flex min-h-0 flex-1 flex-col"
          data-testid="billing-hub-detail-rail"
          aria-hidden
        />
      }
    />
  );
}
