"use client";
import React, { Suspense, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
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
import { OFFLINE_HUB_SLOT_INDEX } from "@/features/offline/offlineHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { TECHNICIAN_HUB_SLOT_INDEX } from "@/features/interventions/technicianDashboardConstants";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
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
import { PwaCopilotAgentBridgeProvider } from "@/context/PwaCopilotAgentBridgeContext";
import { BillingHubIntentProvider } from "@/context/BillingHubIntentContext";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import { TechnicianFinishJobProvider } from "@/context/TechnicianFinishJobContext";
import { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
import TechnicianNotificationBootstrap from "@/features/notifications/components/TechnicianNotificationBootstrap";
import DevPreviewAnonymousAuth from "@/features/dev/DevPreviewAnonymousAuth";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import StagingPreviewBanner from "@/features/dev/StagingPreviewBanner";
import { RequesterHubProvider } from "@/features/interventions/context/RequesterHubContext";
import { TechnicianBackofficeReportBridgeProvider } from "@/context/TechnicianBackofficeReportBridgeContext";
import DashboardDesktopShell from "@/features/dashboard/components/DashboardDesktopShell";
import MobileShell from "@/features/dashboard/components/MobileShell";
import { DASHBOARD_DESKTOP_COL_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import ActivityLogPageObserver from "@/features/crmHistory/components/ActivityLogPageObserver";
import AuthActivityLogger from "@/features/crmHistory/components/AuthActivityLogger";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { useAccountRole } from "@/features/auth/useAccountRole";

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
  { ssr: false, loading: () => null }
);

const TechnicianHubPage = dynamic(
  () => import("@/features/interventions/components/TechnicianHubPage"),
  { ssr: false, loading: () => null }
);

const GmailHubPage = dynamic(() => import("@/features/gmail/components/GmailHubPage"), {
  ssr: false,
  loading: () => null,
});

const FeatureHubPage = dynamic(() => import("@/features/featureHub/components/FeatureHubPage"), {
  ssr: false,
  loading: () => null,
});

const CrmHistoryPage = dynamic(() => import("@/features/crmHistory/components/CrmHistoryPage"), {
  ssr: false,
  loading: () => null,
});

const BillingHubPage = dynamic(() => import("@/features/billingHub/components/BillingHubPage"), {
  ssr: false,
  loading: () => null,
});

const OfflineHubPage = dynamic(
  () => import("@/features/offline/components/TechnicianOfflineHubPage"),
  { ssr: false, loading: () => null }
);

const desktopHeader = (
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
      <UserProfile interactive />
    </aside>
  </>
);

/** Écran d'accueil — **8 pages** : carte · société · technicien · Matériel · CRM · Facturation · Gmail · Assistant IA. */
export default function Dashboard() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { isTechnicianAccount, isLoading: isAccountRoleLoading } = useAccountRole();

  // Mobile + compte technicien → route dédiée /m/technician (shell allégé sans le carrousel 8 hubs).
  // Desktop : on laisse les techniciens sur le dashboard normal (cas dispatcher-technicien).
  useEffect(() => {
    if (isAccountRoleLoading) return;
    if (isMobile !== true) return;
    if (!isTechnicianAccount) return;
    router.replace("/m/technician");
  }, [isAccountRoleLoading, isMobile, isTechnicianAccount, router]);

  const dashboardPages = useMemo(() => {
    const adminMap = (
      <ErrorBoundary key="map" name="map">
        <MapboxView />
        <MacroDroidIndicator />
        <AutoProcessUploads />
      </ErrorBoundary>
    );
    const secondary = (
      <ErrorBoundary key="secondary" name="secondary">
        <DashboardSecondaryPlaceholder />
      </ErrorBoundary>
    );
    const technicianHub = (
      <ErrorBoundary key="technician-hub" name="technician-hub">
        <TechnicianHubPage slotIndex={TECHNICIAN_HUB_SLOT_INDEX} />
      </ErrorBoundary>
    );
    const featureHub = (
      <ErrorBoundary key="feature-hub" name="feature-hub">
        <FeatureHubPage slotIndex={FEATURE_HUB_SLOT_INDEX} />
      </ErrorBoundary>
    );
    const crmHistory = (
      <ErrorBoundary key="crm-history" name="crm-history">
        <CrmHistoryPage slotIndex={CRM_HISTORY_SLOT_INDEX} />
      </ErrorBoundary>
    );
    const billingHub = (
      <ErrorBoundary key="billing-hub" name="billing-hub">
        <BillingHubPage slotIndex={BILLING_HUB_SLOT_INDEX} />
      </ErrorBoundary>
    );
    const gmailHub = (
      <ErrorBoundary key="gmail-hub" name="gmail-hub">
        <GmailHubPage slotIndex={GMAIL_HUB_SLOT_INDEX} />
      </ErrorBoundary>
    );
    const offlineHub = (
      <ErrorBoundary key="offline-hub" name="offline-hub">
        <OfflineHubPage slotIndex={OFFLINE_HUB_SLOT_INDEX} />
      </ErrorBoundary>
    );

    // Compte technicien : on garde les indices de slot fixes (pour ne pas casser
    // les setPageIndex globaux) mais on remplace les pages admin par des fragments
    // vides — leurs chunks dynamic() ne se chargent jamais sur ce compte.
    if (isTechnicianAccount) {
      const empty = <React.Fragment key="empty" />;
      return [
        adminMap, // 0 — carte (utile au tech en mobile pour situer sa tournée)
        empty, // 1 — espace société (admin)
        technicianHub, // 2
        empty, // 3 — matériel (admin)
        empty, // 4 — CRM history (admin)
        empty, // 5 — billing (admin)
        empty, // 6 — gmail (admin)
        offlineHub, // 7 — offline hub (technicien)
      ];
    }

    return [
      adminMap,
      secondary,
      technicianHub,
      featureHub,
      crmHistory,
      billingHub,
      gmailHub,
      offlineHub,
    ];
  }, [isTechnicianAccount]);

  return (
    <DateProvider>
      <DesktopOnlyGate>
        <LoginOverlay>
          <DevServiceWorkerCleanup />
          <DevPreviewAnonymousAuth />
          <CompanyWorkspaceProvider>
            <GalaxyLayerBridgeProvider>
              <DashboardPagerProvider pageCount={dashboardPages.length}>
                <DashboardPageSelectorProvider>
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
                                        <PwaCopilotAgentBridgeProvider>
                                          <BillingHubIntentProvider>
                                            <TechnicianBackofficeReportBridgeProvider>
                                              <TechnicianFinishJobProvider>
                                                <Suspense fallback={null}>
                                                  <TechnicianNotificationBootstrap />
                                                </Suspense>
                                                <ClientPortalAuthEffects />
                                                <Suspense fallback={null}>
                                                  <ClientPortalNotificationBootstrap />
                                                  <ClientPortalPaymentReturnEffects />
                                                </Suspense>
                                                <AuthActivityLogger />
                                                <ActivityLogPageObserver />

                                                {isMobile === null ? (
                                                  <div
                                                    data-testid="mobile-detection-loading"
                                                    className="flex min-h-dvh items-center justify-center bg-slate-50"
                                                  >
                                                    <div
                                                      className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"
                                                      aria-hidden
                                                    />
                                                  </div>
                                                ) : isMobile ? (
                                                  <LayoutShellProvider mode="mobile">
                                                    <MobileShell pages={dashboardPages} />
                                                  </LayoutShellProvider>
                                                ) : (
                                                  <LayoutShellProvider mode="desktop">
                                                    <DashboardDesktopShell
                                                      header={desktopHeader}
                                                      pager={
                                                        <DashboardPager pages={dashboardPages} />
                                                      }
                                                      galaxy={<DashboardGalaxyLayer />}
                                                    />
                                                  </LayoutShellProvider>
                                                )}
                                              </TechnicianFinishJobProvider>
                                            </TechnicianBackofficeReportBridgeProvider>
                                          </BillingHubIntentProvider>
                                        </PwaCopilotAgentBridgeProvider>
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
                </DashboardPageSelectorProvider>
              </DashboardPagerProvider>
            </GalaxyLayerBridgeProvider>
          </CompanyWorkspaceProvider>
        </LoginOverlay>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
