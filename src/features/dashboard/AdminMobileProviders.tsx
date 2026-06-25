"use client";

import type { ReactNode } from "react";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { FeatureFlagsProvider } from "@/core/FeatureFlagsProvider";
import { BackofficeInboxIntentProvider } from "@/context/BackofficeInboxIntentContext";
import { MobileGalaxyComposerOpenProvider } from "@/context/MobileGalaxyComposerOpenContext";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { MobileDockOnboardingProvider } from "@/features/dashboard/MobileDockOnboardingContext";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import DeferredAdminBootstraps from "@/features/dashboard/components/DeferredAdminBootstraps";

const ADMIN_MOBILE_PAGE_COUNT = 1;

type Props = {
  children: ReactNode;
};

/** Providers `/m/admin` — auth, workspace, inbox intent, pager 1 page (sans chatbot / bridges agent). */
export default function AdminMobileProviders({ children }: Props) {
  return (
    <DateProvider>
      <LoginOverlay>
        <DevServiceWorkerCleanup />
        <CompanyWorkspaceProvider>
          <FeatureFlagsProvider>
            <GalaxyLayerBridgeProvider>
              <MobileGalaxyComposerOpenProvider>
                <DashboardPagerProvider pageCount={ADMIN_MOBILE_PAGE_COUNT}>
                  <DashboardPageSelectorProvider>
                    <MobileDockOnboardingProvider>
                      <BackofficeInboxIntentProvider>
                        <DeferredAdminBootstraps />
                        {children}
                      </BackofficeInboxIntentProvider>
                    </MobileDockOnboardingProvider>
                  </DashboardPageSelectorProvider>
                </DashboardPagerProvider>
              </MobileGalaxyComposerOpenProvider>
            </GalaxyLayerBridgeProvider>
          </FeatureFlagsProvider>
        </CompanyWorkspaceProvider>
      </LoginOverlay>
    </DateProvider>
  );
}
