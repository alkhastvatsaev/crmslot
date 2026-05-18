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
import { BACKOFFICE_HUB_SLOT_INDEX } from "@/features/backoffice/backofficeHubConstants";
import { AI_ASSISTANT_SLOT_INDEX } from "@/features/ai/aiAssistantConstants";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import { TECHNICIAN_LAB_SLOT_INDEX } from "@/features/technicians/technicianLabConstants";
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

const BackOfficeHubPage = dynamic(
  () => import("@/features/backoffice/components/BackOfficeHubPage"),
  { ssr: false, loading: () => null },
);

const TechnicianLabCarouselPage = dynamic(
  () => import("@/features/technicians/components/TechnicianLabCarouselPage"),
  { ssr: false, loading: () => null },
);

const ChatbotPage = dynamic(() => import("@/features/chatbot/components/ChatbotPage"), {
  ssr: false,
  loading: () => null,
});

/** Écran d’accueil — **6 pages** : carte · société · technicien · back-office · Chatbot · lab. */
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
      <BackOfficeHubPage key="backoffice-hub" slotIndex={BACKOFFICE_HUB_SLOT_INDEX} />,
      <ChatbotPage key="chatbot" slotIndex={AI_ASSISTANT_SLOT_INDEX} />,
      <TechnicianLabCarouselPage key="technician-lab" slotIndex={TECHNICIAN_LAB_SLOT_INDEX} />,
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
