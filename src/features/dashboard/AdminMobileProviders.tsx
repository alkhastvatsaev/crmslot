"use client";

import type { ReactNode } from "react";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { FeatureFlagsProvider } from "@/core/FeatureFlagsProvider";
import { BackofficeInboxIntentProvider } from "@/context/BackofficeInboxIntentContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
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
      <DesktopOnlyGate>
        <LoginOverlay>
          <DevServiceWorkerCleanup />
          <CompanyWorkspaceProvider>
            <FeatureFlagsProvider>
              <DashboardPagerProvider pageCount={ADMIN_MOBILE_PAGE_COUNT}>
                <DashboardPageSelectorProvider>
                  <BackofficeInboxIntentProvider>
                    <DeferredAdminBootstraps />
                    {children}
                  </BackofficeInboxIntentProvider>
                </DashboardPageSelectorProvider>
              </DashboardPagerProvider>
            </FeatureFlagsProvider>
          </CompanyWorkspaceProvider>
        </LoginOverlay>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
