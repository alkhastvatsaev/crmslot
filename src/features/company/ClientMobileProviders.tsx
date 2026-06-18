"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { RequesterHubProvider } from "@/features/interventions/context/RequesterHubContext";
import { ClientPortalPushProvider } from "@/features/notifications/ClientPortalPushContext";
import ClientPortalAuthEffects from "@/features/auth/components/ClientPortalAuthEffects";
import ClientPortalNotificationBootstrap from "@/features/notifications/components/ClientPortalNotificationBootstrap";
import ClientPortalPaymentReturnEffects from "@/features/auth/components/ClientPortalPaymentReturnEffects";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import AndroidAppInstallPromoBootstrap from "@/core/pwa/AndroidAppInstallPromoBootstrap";

const CLIENT_MOBILE_PAGE_COUNT = 1;

type Props = {
  children: ReactNode;
};

/** Providers portail client — importé par `/m/demande` uniquement. */
export default function ClientMobileProviders({ children }: Props) {
  return (
    <DateProvider>
      <DesktopOnlyGate>
        <DevServiceWorkerCleanup />
        <AndroidAppInstallPromoBootstrap surface="demande" presentation="toast" />
        <CompanyWorkspaceProvider>
          <GalaxyLayerBridgeProvider>
            <DashboardPagerProvider pageCount={CLIENT_MOBILE_PAGE_COUNT}>
              <DashboardPageSelectorProvider>
                <RequesterHubProvider>
                  <ClientPortalPushProvider>
                    <ClientPortalAuthEffects />
                    <Suspense fallback={null}>
                      <ClientPortalNotificationBootstrap />
                      <ClientPortalPaymentReturnEffects />
                    </Suspense>
                    {children}
                  </ClientPortalPushProvider>
                </RequesterHubProvider>
              </DashboardPageSelectorProvider>
            </DashboardPagerProvider>
          </GalaxyLayerBridgeProvider>
        </CompanyWorkspaceProvider>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
