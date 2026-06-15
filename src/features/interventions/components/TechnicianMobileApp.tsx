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
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import StagingPreviewBanner from "@/features/dev/StagingPreviewBanner";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import ChatbotGalaxyComposer from "@/features/chatbot/components/ChatbotGalaxyComposer";

/** Index unique dans cette shell (une seule page — pas le carrousel 8 hubs). */
export const TECHNICIAN_MOBILE_APP_SLOT_INDEX = 0;

/**
 * App terrain allégée — missions, clôture, offline.
 * Route : `/m/technician` (Capacitor Android entreprise).
 */
export default function TechnicianMobileApp() {
  return (
    <DateProvider>
      <DesktopOnlyGate>
        <TechnicianLoginGate>
          <DevServiceWorkerCleanup />
          <CompanyWorkspaceProvider>
            <TechnicianQueryProvider>
              <OfflineSyncProvider>
                <TechnicianCaseIntentProvider>
                  <TechnicianFinishJobProvider>
                    <ChatbotProvider>
                      <TechnicianNotificationBootstrap />
                      <LayoutShellProvider mode="mobile">
                        <MobileHubRailProvider>
                          <div
                            className="technician-mobile-app flex h-dvh flex-col overflow-hidden bg-slate-50"
                            data-testid="technician-mobile-app"
                          >
                            <StagingPreviewBanner />
                            <header className="technician-mobile-app__header flex shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
                              <ClockCalendar compact interactive />
                            </header>
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                              <ErrorBoundary name="technician-mobile-hub">
                                <TechnicianHubPage slotIndex={TECHNICIAN_MOBILE_APP_SLOT_INDEX} />
                              </ErrorBoundary>
                            </div>
                            <footer className="technician-mobile-app__galaxy-dock shrink-0 bg-slate-950">
                              <ChatbotGalaxyComposer />
                            </footer>
                          </div>
                        </MobileHubRailProvider>
                      </LayoutShellProvider>
                    </ChatbotProvider>
                  </TechnicianFinishJobProvider>
                </TechnicianCaseIntentProvider>
              </OfflineSyncProvider>
            </TechnicianQueryProvider>
          </CompanyWorkspaceProvider>
        </TechnicianLoginGate>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
