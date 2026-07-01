"use client";

import { useEffect, useMemo, useState } from "react";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";
import AdaptiveTriplePanelLayout from "@/features/dashboard/components/AdaptiveTriplePanelLayout";
import CompanyChatPanel from "@/features/backoffice/components/CompanyChatPanel";
import RequesterProfilePanel from "@/features/interventions/components/RequesterProfilePanel";
import RequesterInterventionPanel from "@/features/interventions/components/RequesterInterventionPanel";
import RequesterTrackingPanel from "@/features/interventions/components/RequesterTrackingPanel";
import {
  COMPANY_HUB_ANCHOR_CLIENT_PORTAL,
  COMPANY_HUB_ANCHOR_SMART_FORM,
  COMPANY_HUB_ANCHOR_WORKSPACE,
} from "@/features/company/companyHubNavigation";
import { DASHBOARD_DESKTOP_PANEL_GAP_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { HUB_RAIL_BODY_CLASS, HubSegmentedControl } from "@/core/ui/hub";
import { useTranslation } from "@/core/i18n/I18nContext";
import { triggerRequesterMobileHaptic } from "@/features/interventions/requesterMobileHaptics";

/** Rails hub — remplissent la hauteur vitre sans marge basse (évite le rectangle blanc). */
const railBody = `${HUB_RAIL_BODY_CLASS} ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS}`;

import { CompanyHubInvoiceTab } from "@/features/company/components/CompanyHubInvoiceTab";
import { useRequesterHub } from "@/context/RequesterHubContext";
import { resolvePortalChatCompanyId } from "@/features/company/clientPortalCompanyId";
import { useClientPortalLinkedCompanyId } from "@/features/auth/hooks/useClientPortalLinkedCompanyId";
import { useActivityLog } from "@/features/crmHistory/useActivityLog";

type CompanyHubRightCategory = "tracking" | "chat" | "invoice";

const PORTAL_RIGHT_TABS: readonly CompanyHubRightCategory[] = ["tracking", "chat", "invoice"];

function normalizePortalRightTab(
  tab: "tracking" | "chat" | "invoice" | "documents" | "timeline"
): CompanyHubRightCategory {
  return PORTAL_RIGHT_TABS.includes(tab as CompanyHubRightCategory)
    ? (tab as CompanyHubRightCategory)
    : "tracking";
}

/** Interface Demandeur (Page 2) — Qui demande, Que faut-il réparer, Où en est ma demande. */
export default function CompanyHubPage() {
  const [rightCategory, setRightCategory] = useState<CompanyHubRightCategory>("tracking");
  const { t } = useTranslation();
  const { logNote } = useActivityLog();
  const {
    lastSubmittedInterventionId,
    pendingTrackingInterventionId,
    portalRightTab,
    setPortalRightTab,
  } = useRequesterHub();

  const portalCaseId = pendingTrackingInterventionId ?? lastSubmittedInterventionId;

  useEffect(() => {
    if (!portalRightTab) return;
    scheduleEffectUpdate(() => {
      setRightCategory(normalizePortalRightTab(portalRightTab));
      setPortalRightTab(null);
    });
  }, [portalRightTab, setPortalRightTab]);

  const linkedPortalCompanyId = useClientPortalLinkedCompanyId();

  const portalChatCompanyId = useMemo(
    () => resolvePortalChatCompanyId(linkedPortalCompanyId),
    [linkedPortalCompanyId]
  );

  const leftPanel = (
    <section
      id={COMPANY_HUB_ANCHOR_WORKSPACE}
      data-testid="company-hub-rail-demande"
      className={`${railBody} scroll-mt-2`}
    >
      <RequesterProfilePanel />
    </section>
  );

  const centerPanel = (
    <section id={COMPANY_HUB_ANCHOR_SMART_FORM} className={`${railBody} scroll-mt-2`}>
      <RequesterInterventionPanel />
    </section>
  );

  const rightPanel = (
    <section
      id={COMPANY_HUB_ANCHOR_CLIENT_PORTAL}
      data-testid="company-hub-rail-portail"
      className="flex min-h-0 flex-1 flex-col overflow-hidden scroll-mt-2"
    >
      <HubSegmentedControl
        value={rightCategory}
        onChange={(id) => {
          setRightCategory(id as CompanyHubRightCategory);
          logNote(`Espace société / ${id}`);
        }}
        ariaLabel={t("company_hub.right_tabs.aria")}
        className="shrink-0"
        options={[
          {
            id: "tracking",
            label: t("company_hub.right_tabs.tracking"),
            testId: "company-hub-right-tab-tracking",
            activeAccent: "blue",
          },
          {
            id: "chat",
            label: t("company_hub.right_tabs.chat"),
            testId: "company-hub-right-tab-chat",
            activeAccent: "blue",
          },
          {
            id: "invoice",
            label: t("company_hub.right_tabs.invoice"),
            testId: "company-hub-right-tab-invoice",
            activeAccent: "slate",
          },
        ]}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden" role="tabpanel">
        {rightCategory === "tracking" ? (
          <RequesterTrackingPanel />
        ) : rightCategory === "chat" ? (
          <CompanyChatPanel
            className="min-h-0 flex-1"
            publishAsPortal
            chatCompanyId={portalChatCompanyId}
            chatInterventionId={portalCaseId}
          />
        ) : (
          <CompanyHubInvoiceTab interventionId={portalCaseId} />
        )}
      </div>
    </section>
  );

  return (
    <AdaptiveTriplePanelLayout
      rootTestId="dashboard-secondary-placeholder"
      leftTestId="dashboard-secondary-panel-left"
      centerTestId="dashboard-secondary-panel-center"
      rightTestId="dashboard-secondary-panel-right"
      leftAriaLabel={t("company_hub.aria.left")}
      centerAriaLabel={t("company_hub.aria.center")}
      rightAriaLabel={t("company_hub.aria.right")}
      mobileLeftLabel={String(t("company_hub.mobile_rails.profile"))}
      mobileCenterLabel={String(t("company_hub.mobile_rails.request"))}
      mobileRightLabel={String(t("company_hub.mobile_rails.tracking"))}
      onRailChange={() => triggerRequesterMobileHaptic("light")}
      left={leftPanel}
      center={centerPanel}
      right={rightPanel}
      centerPadding={false}
      rightPadding={false}
    />
  );
}
