"use client";

import LoginOverlay from "@/features/auth/components/LoginOverlay";
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
        <LoginOverlay>
          <DevServiceWorkerCleanup />
          <CompanyWorkspaceProvider>
            <TechnicianQueryProvider>
              <OfflineSyncProvider>
                <TechnicianCaseIntentProvider>
                  <TechnicianFinishJobProvider>
                    <TechnicianNotificationBootstrap />
                    <LayoutShellProvider mode="mobile">
                      <MobileHubRailProvider>
                        <div
                          className="technician-mobile-app flex h-dvh flex-col overflow-hidden bg-slate-50"
                          data-testid="technician-mobile-app"
                        >
                          <StagingPreviewBanner />
                          <ErrorBoundary name="technician-mobile-hub">
                            <TechnicianHubPage slotIndex={TECHNICIAN_MOBILE_APP_SLOT_INDEX} />
                          </ErrorBoundary>
                        </div>
                      </MobileHubRailProvider>
                    </LayoutShellProvider>
                  </TechnicianFinishJobProvider>
                </TechnicianCaseIntentProvider>
              </OfflineSyncProvider>
            </TechnicianQueryProvider>
          </CompanyWorkspaceProvider>
        </LoginOverlay>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
