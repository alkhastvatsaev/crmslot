"use client";
import React, { Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import SpotlightSearch from "@/features/dashboard/components/SpotlightSearch";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import UserProfile from "@/features/dashboard/components/UserProfile";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import MacroDroidIndicator from "@/features/dashboard/components/MacroDroidIndicator";
import AutoProcessUploads from "@/features/dashboard/components/AutoProcessUploads";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import DashboardPager from "@/features/dashboard/components/DashboardPager";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { TECHNICIAN_HUB_SLOT_INDEX } from "@/features/interventions/technicianDashboardConstants";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
import ClientPortalAuthEffects from "@/features/auth/components/ClientPortalAuthEffects";
import ClientPortalPaymentReturnEffects from "@/features/auth/components/ClientPortalPaymentReturnEffects";
import { ClientPortalPushProvider } from "@/features/notifications/ClientPortalPushContext";
import ClientPortalNotificationBootstrap from "@/features/notifications/components/ClientPortalNotificationBootstrap";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { TechnicianCaseIntentProvider } from "@/context/TechnicianCaseIntentContext";
import { BackofficeInboxIntentProvider } from "@/context/BackofficeInboxIntentContext";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";
import { CompanyStockAgentBridgeProvider } from "@/context/CompanyStockAgentBridgeContext";
import { CrmHistoryAgentBridgeProvider } from "@/context/CrmHistoryAgentBridgeContext";
import { BillingHubAgentBridgeProvider } from "@/context/BillingHubAgentBridgeContext";
import { BillingHubIntentProvider } from "@/context/BillingHubIntentContext";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import { TechnicianFinishJobProvider } from "@/context/TechnicianFinishJobContext";
import TechnicianConnectivityBar from "@/features/offline/components/TechnicianConnectivityBar";
import { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
import TechnicianNotificationBootstrap from "@/features/notifications/components/TechnicianNotificationBootstrap";
import DevPreviewAnonymousAuth from "@/features/dev/DevPreviewAnonymousAuth";
import StagingPreviewBanner from "@/features/dev/StagingPreviewBanner";
import { RequesterHubProvider } from "@/features/interventions/context/RequesterHubContext";
import { TechnicianBackofficeReportBridgeProvider } from "@/context/TechnicianBackofficeReportBridgeContext";
import DashboardDesktopShell from "@/features/dashboard/components/DashboardDesktopShell";
import { DASHBOARD_DESKTOP_COL_CLASS } from "@/core/ui/dashboardDesktopLayout";

const MapboxView = dynamic(() => import("@/features/map/components/MapboxView"), {
  ssr: false,
  loading: () => (
    <main
      id="map-container"
      data-testid="map-container-loading"
      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center min-h-[320px] animate-pulse bg-slate-100`}
      aria-busy="true"
    />
  ),
});

const DashboardSecondaryPlaceholder = dynamic(
  () => import("@/features/dashboard/components/DashboardSecondaryPlaceholder"),
  { ssr: false, loading: () => null },
);

const TechnicianHubPage = dynamic(
  () => import("@/features/interventions/components/TechnicianHubPage"),
  { ssr: false, loading: () => null },
);

const GmailHubPage = dynamic(() => import("@/features/gmail/components/GmailHubPage"), {
  ssr: false,
  loading: () => null,
});

const FeatureHubPage = dynamic(() => import("@/features/featureHub/components/FeatureHubPage"), {
  ssr: false,
  loading: () => null,
});

const CrmHistoryPage = dynamic(
  () => import("@/features/crmHistory/components/CrmHistoryPage"),
  { ssr: false, loading: () => null },
);

const BillingHubPage = dynamic(() => import("@/features/billingHub/components/BillingHubPage"), {
  ssr: false,
  loading: () => null,
});

/** Écran d’accueil — **7 pages** : carte · société · technicien · Gmail · Matériel · CRM · Facturation. */
export default function Dashboard() {
  const dashboardPages = useMemo(
    () => [
      <>
        <MapboxView />
        <MacroDroidIndicator />
        <AutoProcessUploads />
      </>,
      <DashboardSecondaryPlaceholder key="secondary" />,
      <TechnicianHubPage key="technician-hub" slotIndex={TECHNICIAN_HUB_SLOT_INDEX} />,
      <GmailHubPage key="gmail-hub" slotIndex={GMAIL_HUB_SLOT_INDEX} />,
      <FeatureHubPage key="feature-hub" slotIndex={FEATURE_HUB_SLOT_INDEX} />,
      <CrmHistoryPage key="crm-history" slotIndex={CRM_HISTORY_SLOT_INDEX} />,
      <BillingHubPage key="billing-hub" slotIndex={BILLING_HUB_SLOT_INDEX} />,
    ],
    [],
  );

  return (
    <DateProvider>
      <DesktopOnlyGate>
        <LoginOverlay>
          <DevPreviewAnonymousAuth />
          <CompanyWorkspaceProvider>
            <GalaxyLayerBridgeProvider>
              <DashboardPagerProvider pageCount={dashboardPages.length}>
                <ChatbotProvider>
                <RequesterHubProvider>
                  <ClientPortalPushProvider>
                  <TechnicianQueryProvider>
                    <OfflineSyncProvider>
                      <TechnicianCaseIntentProvider>
                        <BackofficeInboxIntentProvider>
                        <CompanyStockIntentProvider>
                        <CompanyStockAgentBridgeProvider>
                        <CrmHistoryAgentBridgeProvider>
                        <BillingHubAgentBridgeProvider>
                        <BillingHubIntentProvider>
                        <TechnicianBackofficeReportBridgeProvider>
                          <TechnicianFinishJobProvider>
                            <TechnicianConnectivityBar />
                            <Suspense fallback={null}>
                              <TechnicianNotificationBootstrap />
                            </Suspense>
                            <ClientPortalAuthEffects />
                            <Suspense fallback={null}>
                              <ClientPortalNotificationBootstrap />
                              <ClientPortalPaymentReturnEffects />
                            </Suspense>
                            <DashboardDesktopShell
                              header={
                                <>
                                  <aside
                                    className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--left pointer-events-auto`}
                                  >
                                    <ClockCalendar />
                                  </aside>
                                  <div
                                    className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center pointer-events-auto flex flex-col gap-2`}
                                  >
                                    <StagingPreviewBanner />
                                    <SpotlightSearch />
                                  </div>
                                  <aside
                                    className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--right pointer-events-auto`}
                                  >
                                    <UserProfile />
                                  </aside>
                                </>
                              }
                              pager={<DashboardPager pages={dashboardPages} />}
                              galaxy={<DashboardGalaxyLayer />}
                            />
                          </TechnicianFinishJobProvider>
                        </TechnicianBackofficeReportBridgeProvider>
                        </BillingHubIntentProvider>
                        </BillingHubAgentBridgeProvider>
                        </CrmHistoryAgentBridgeProvider>
                        </CompanyStockAgentBridgeProvider>
                        </CompanyStockIntentProvider>
                        </BackofficeInboxIntentProvider>
                      </TechnicianCaseIntentProvider>
                    </OfflineSyncProvider>
                  </TechnicianQueryProvider>
                  </ClientPortalPushProvider>
                </RequesterHubProvider>
                </ChatbotProvider>
              </DashboardPagerProvider>
            </GalaxyLayerBridgeProvider>
          </CompanyWorkspaceProvider>
        </LoginOverlay>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
