"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { FeatureFlagsProvider } from "@/core/FeatureFlagsProvider";
import { DashboardPagerProvider } from "@/features/dashboard";
import { DashboardPageSelectorProvider } from "@/features/dashboard";
import { RequesterHubProvider } from "@/context/RequesterHubContext";
import { ClientPortalPushProvider } from "@/features/notifications/ClientPortalPushContext";
import ClientPortalAuthEffects from "@/features/auth/components/ClientPortalAuthEffects";
import ClientPortalPaymentReturnEffects from "@/features/auth/components/ClientPortalPaymentReturnEffects";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import DeferredClientBootstraps from "@/features/company/components/DeferredClientBootstraps";

const CLIENT_MOBILE_PAGE_COUNT = 1;

type Props = {
  children: ReactNode;
};

/** Providers portail client — importé par `/m/demande` uniquement. */
export default function ClientMobileProviders({ children }: Props) {
  return (
    <DateProvider>
      <DevServiceWorkerCleanup />
      <CompanyWorkspaceProvider>
        <FeatureFlagsProvider>
          <DashboardPagerProvider pageCount={CLIENT_MOBILE_PAGE_COUNT}>
            <DashboardPageSelectorProvider>
              <RequesterHubProvider>
                <ClientPortalPushProvider>
                  <ClientPortalAuthEffects />
                  <Suspense fallback={null}>
                    <ClientPortalPaymentReturnEffects />
                  </Suspense>
                  <DeferredClientBootstraps />
                  {children}
                </ClientPortalPushProvider>
              </RequesterHubProvider>
            </DashboardPageSelectorProvider>
          </DashboardPagerProvider>
        </FeatureFlagsProvider>
      </CompanyWorkspaceProvider>
    </DateProvider>
  );
}
