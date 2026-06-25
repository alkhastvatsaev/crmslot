"use client";

import type { ReactNode } from "react";
import TechnicianLoginGate from "@/features/auth/components/TechnicianLoginGate";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { FeatureFlagsProvider } from "@/core/FeatureFlagsProvider";
import { TechnicianCaseIntentProvider } from "@/context/TechnicianCaseIntentContext";
import { TechnicianFinishJobProvider } from "@/context/TechnicianFinishJobContext";
import { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import { DashboardPagerProvider } from "@/features/dashboard";
import { DashboardPageSelectorProvider } from "@/features/dashboard";
import { MobileDockOnboardingProvider } from "@/features/dashboard/MobileDockOnboardingContext";
import DeferredTechnicianBootstraps from "@/features/interventions/components/DeferredTechnicianBootstraps";

const TECHNICIAN_MOBILE_PAGE_COUNT = 1;

type Props = {
  children: ReactNode;
};

/** Providers app terrain — importé par `/m/technician` uniquement. */
export default function TechnicianMobileProviders({ children }: Props) {
  return (
    <DateProvider>
      <DevServiceWorkerCleanup />
      <CompanyWorkspaceProvider>
        <FeatureFlagsProvider>
          <DashboardPagerProvider pageCount={TECHNICIAN_MOBILE_PAGE_COUNT}>
            <DashboardPageSelectorProvider>
              <MobileDockOnboardingProvider>
                <TechnicianQueryProvider>
                  <OfflineSyncProvider>
                    <TechnicianCaseIntentProvider>
                      <TechnicianFinishJobProvider>
                        <DeferredTechnicianBootstraps />
                        <TechnicianLoginGate>{children}</TechnicianLoginGate>
                      </TechnicianFinishJobProvider>
                    </TechnicianCaseIntentProvider>
                  </OfflineSyncProvider>
                </TechnicianQueryProvider>
              </MobileDockOnboardingProvider>
            </DashboardPageSelectorProvider>
          </DashboardPagerProvider>
        </FeatureFlagsProvider>
      </CompanyWorkspaceProvider>
    </DateProvider>
  );
}
