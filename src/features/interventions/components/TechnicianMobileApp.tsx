"use client";

import TechnicianHubPage from "@/features/interventions/components/TechnicianHubPage";
import TechnicianMobileShell from "@/features/interventions/components/TechnicianMobileShell";
import TechnicianMobileProviders from "@/features/interventions/TechnicianMobileProviders";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import StagingPreviewBanner from "@/features/dev/StagingPreviewBanner";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import { TECHNICIAN_MOBILE_APP_SLOT_INDEX } from "@/features/interventions/technicianMobileAppConstants";

/**
 * App terrain — missions, clôture, offline + chrome mobile (calendrier · Galaxy).
 * Route : `/m/technician` (Capacitor Android entreprise).
 */
export default function TechnicianMobileApp() {
  return (
    <TechnicianMobileProviders>
      <LayoutShellProvider mode="mobile">
        <MobileHubRailProvider>
          <TechnicianMobileShell>
            <StagingPreviewBanner />
            <ErrorBoundary name="technician-mobile-hub">
              <TechnicianHubPage slotIndex={TECHNICIAN_MOBILE_APP_SLOT_INDEX} />
            </ErrorBoundary>
          </TechnicianMobileShell>
        </MobileHubRailProvider>
      </LayoutShellProvider>
    </TechnicianMobileProviders>
  );
}
