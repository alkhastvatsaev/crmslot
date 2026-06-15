"use client";

import TechnicianLoginGate from "@/features/auth/components/TechnicianLoginGate";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { TechnicianCaseIntentProvider } from "@/context/TechnicianCaseIntentContext";
import { TechnicianFinishJobProvider } from "@/context/TechnicianFinishJobContext";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import TechnicianNotificationBootstrap from "@/features/notifications/components/TechnicianNotificationBootstrap";
import TechnicianHubPage from "@/features/interventions/components/TechnicianHubPage";
import TechnicianMobileShell from "@/features/interventions/components/TechnicianMobileShell";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import StagingPreviewBanner from "@/features/dev/StagingPreviewBanner";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";

/** Index unique dans cette shell (une seule page — pas le carrousel 8 hubs). */
export const TECHNICIAN_MOBILE_APP_SLOT_INDEX = 0;

/** Une page logique pour le dock Galaxy (index 0 = transcription / chatbot carte). */
const TECHNICIAN_MOBILE_PAGE_COUNT = 1;

/**
 * App terrain — missions, clôture, offline + chrome mobile (calendrier · Galaxy).
 * Route : `/m/technician` (Capacitor Android entreprise).
 */
export default function TechnicianMobileApp() {
  return (
    <DateProvider>
      <DesktopOnlyGate>
        <TechnicianLoginGate>
          <DevServiceWorkerCleanup />
          <CompanyWorkspaceProvider>
            <GalaxyLayerBridgeProvider>
              <DashboardPagerProvider pageCount={TECHNICIAN_MOBILE_PAGE_COUNT}>
                <DashboardPageSelectorProvider>
                  <ChatbotProvider>
                    <TechnicianQueryProvider>
                      <OfflineSyncProvider>
                        <TechnicianCaseIntentProvider>
                          <TechnicianFinishJobProvider>
                            <TechnicianNotificationBootstrap />
                            <LayoutShellProvider mode="mobile">
                              <MobileHubRailProvider>
                                <TechnicianMobileShell>
                                  <StagingPreviewBanner />
                                  <ErrorBoundary name="technician-mobile-hub">
                                    <TechnicianHubPage
                                      slotIndex={TECHNICIAN_MOBILE_APP_SLOT_INDEX}
                                    />
                                  </ErrorBoundary>
                                </TechnicianMobileShell>
                              </MobileHubRailProvider>
                            </LayoutShellProvider>
                          </TechnicianFinishJobProvider>
                        </TechnicianCaseIntentProvider>
                      </OfflineSyncProvider>
                    </TechnicianQueryProvider>
                  </ChatbotProvider>
                </DashboardPageSelectorProvider>
              </DashboardPagerProvider>
            </GalaxyLayerBridgeProvider>
          </CompanyWorkspaceProvider>
        </TechnicianLoginGate>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
