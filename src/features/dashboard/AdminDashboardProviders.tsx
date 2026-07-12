"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { MobileDockOnboardingProvider } from "@/features/dashboard/MobileDockOnboardingContext";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import { MobileGalaxyComposerOpenProvider } from "@/context/MobileGalaxyComposerOpenContext";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { FeatureFlagsProvider } from "@/core/FeatureFlagsProvider";
import { BackofficeInboxIntentProvider } from "@/context/BackofficeInboxIntentContext";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";
import { CompanyStockAgentBridgeProvider } from "@/context/CompanyStockAgentBridgeContext";
import { CrmHistoryAgentBridgeProvider } from "@/context/CrmHistoryAgentBridgeContext";
import { BillingHubAgentBridgeProvider } from "@/context/BillingHubAgentBridgeContext";
import { BillingHubIntentProvider } from "@/context/BillingHubIntentContext";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
import { RequesterHubProvider } from "@/context/RequesterHubContext";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import { TechnicianBackofficeReportBridgeProvider } from "@/context/TechnicianBackofficeReportBridgeContext";
import DeferredAdminBootstraps from "@/features/dashboard/components/DeferredAdminBootstraps";
import { prefetchDashboardHubChunksIdle } from "@/features/dashboard/prefetchDashboardHubChunks";
import {
  SubscriptionCheckoutReturnEffects,
  SubscriptionSignupEffects,
  SubscriptionAccessGate,
} from "@/features/subscriptions";
import TeamHubBootPrefetch from "@/features/teamHub/components/TeamHubBootPrefetch";

type Props = {
  pageCount: number;
  children: ReactNode;
};

/** Providers back-office admin uniquement — importé par `src/app/page.tsx`. */
export default function AdminDashboardProviders({ pageCount, children }: Props) {
  useEffect(() => {
    prefetchDashboardHubChunksIdle();
  }, []);

  return (
    <DateProvider>
      <LoginOverlay>
        <DevServiceWorkerCleanup />
        <CompanyWorkspaceProvider>
          <FeatureFlagsProvider>
            <GalaxyLayerBridgeProvider>
              <MobileGalaxyComposerOpenProvider>
                <DashboardPagerProvider pageCount={pageCount}>
                  <DashboardPageSelectorProvider>
                    <MobileDockOnboardingProvider>
                      <ChatbotProvider>
                        <BackofficeInboxIntentProvider>
                          <CompanyStockIntentProvider>
                            <CompanyStockAgentBridgeProvider>
                              <CrmHistoryAgentBridgeProvider>
                                <BillingHubAgentBridgeProvider>
                                  <BillingHubIntentProvider>
                                    <TechnicianBackofficeReportBridgeProvider>
                                      <OfflineSyncProvider>
                                        <TechnicianQueryProvider>
                                          <RequesterHubProvider>
                                            <DeferredAdminBootstraps />
                                            <SubscriptionCheckoutReturnEffects />
                                            <SubscriptionSignupEffects />
                                            <SubscriptionAccessGate>
                                              <TeamHubBootPrefetch />
                                              {children}
                                            </SubscriptionAccessGate>
                                          </RequesterHubProvider>
                                        </TechnicianQueryProvider>
                                      </OfflineSyncProvider>
                                    </TechnicianBackofficeReportBridgeProvider>
                                  </BillingHubIntentProvider>
                                </BillingHubAgentBridgeProvider>
                              </CrmHistoryAgentBridgeProvider>
                            </CompanyStockAgentBridgeProvider>
                          </CompanyStockIntentProvider>
                        </BackofficeInboxIntentProvider>
                      </ChatbotProvider>
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
