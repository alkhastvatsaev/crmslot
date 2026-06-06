"use client";

import { useEffect, useMemo, useState } from "react";
import { scheduleEffectUpdate } from "@/utils/scheduleEffectUpdate";
import { useCompanyWorkspaceOptional } from "@/context/CompanyWorkspaceContext";
import DashboardTriplePanelLayout from "@/features/dashboard/components/DashboardTriplePanelLayout";
import IvanaClientChatPanel from "@/features/backoffice/components/IvanaClientChatPanel";
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

/** Même pas que la grille desktop (`DASHBOARD_DESKTOP_PANEL_GAP_CLASS`) — rythme équidistant. */
const railGap = `${HUB_RAIL_BODY_CLASS} ${DASHBOARD_DESKTOP_PANEL_GAP_CLASS} pb-4`;

import { CompanyHubTimelineTab } from "@/features/company/components/CompanyHubTimelineTab";
import { CompanyHubDocumentsTab } from "@/features/company/components/CompanyHubDocumentsTab";
import { useRequesterHub } from "@/features/interventions/context/RequesterHubContext";

type CompanyHubRightCategory = "tracking" | "chat" | "timeline" | "documents";

/** Interface Demandeur (Page 2) — Qui demande, Que faut-il réparer, Où en est ma demande. */
export default function CompanyHubPage() {
  const [rightCategory, setRightCategory] = useState<CompanyHubRightCategory>("documents");
  const workspace = useCompanyWorkspaceOptional();
  const { t } = useTranslation();
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
      setRightCategory(portalRightTab as CompanyHubRightCategory);
      setPortalRightTab(null);
    });
  }, [portalRightTab, setPortalRightTab]);

  const ivanaChatCompanyId = useMemo(() => {
    if (workspace?.isTenantUser && workspace.activeCompanyId) return workspace.activeCompanyId;
    const env =
      typeof process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID === "string"
        ? process.env.NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID.trim()
        : "";
    return env || null;
  }, [workspace?.isTenantUser, workspace?.activeCompanyId]);

  return (
    <DashboardTriplePanelLayout
      rootTestId="dashboard-secondary-placeholder"
      leftTestId="dashboard-secondary-panel-left"
      centerTestId="dashboard-secondary-panel-center"
      rightTestId="dashboard-secondary-panel-right"
      leftAriaLabel={t("company_hub.aria.left")}
      centerAriaLabel={t("company_hub.aria.center")}
      rightAriaLabel={t("company_hub.aria.right")}
      left={
        <section
          id={COMPANY_HUB_ANCHOR_WORKSPACE}
          data-testid="company-hub-rail-demande"
          className={`${railGap} scroll-mt-2`}
        >
          <RequesterProfilePanel />
        </section>
      }
      center={
        <section id={COMPANY_HUB_ANCHOR_SMART_FORM} className={`${railGap} scroll-mt-2`}>
          <RequesterInterventionPanel />
        </section>
      }
      right={
        <section
          id={COMPANY_HUB_ANCHOR_CLIENT_PORTAL}
          data-testid="company-hub-rail-portail"
          className="flex min-h-0 flex-1 flex-col overflow-hidden scroll-mt-2"
        >
          <HubSegmentedControl
            value={rightCategory}
            onChange={(id) => setRightCategory(id as CompanyHubRightCategory)}
            ariaLabel={t("company_hub.right_tabs.aria")}
            className="mx-4 mt-4 shrink-0"
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
                id: "documents",
                label: "Documents",
                testId: "company-hub-right-tab-documents",
                activeAccent: "rose",
              },
              {
                id: "timeline",
                label: "Historique",
                testId: "company-hub-right-tab-timeline",
                activeAccent: "emerald",
              },
            ]}
          />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden" role="tabpanel">
            {rightCategory === "tracking" ? (
              <RequesterTrackingPanel />
            ) : rightCategory === "chat" ? (
              <IvanaClientChatPanel
                className="min-h-0 flex-1"
                publishAsPortal
                chatCompanyId={ivanaChatCompanyId}
                chatInterventionId={portalCaseId}
              />
            ) : rightCategory === "documents" ? (
              <CompanyHubDocumentsTab
                interventionId={portalCaseId}
                companyId={ivanaChatCompanyId}
              />
            ) : (
              <CompanyHubTimelineTab interventionId={portalCaseId} companyId={ivanaChatCompanyId} />
            )}
          </div>
        </section>
      }
      centerPadding={false}
      rightPadding={false}
    />
  );
}
