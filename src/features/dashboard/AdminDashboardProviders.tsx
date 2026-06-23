"use client";

import type { ReactNode } from "react";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
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

type Props = {
  pageCount: number;
  children: ReactNode;
};

/** Providers back-office admin uniquement — importé par `src/app/page.tsx`. */
export default function AdminDashboardProviders({ pageCount, children }: Props) {
  return (
    <DateProvider>
      <DesktopOnlyGate>
        <LoginOverlay>
          <DevServiceWorkerCleanup />
          <CompanyWorkspaceProvider>
            <FeatureFlagsProvider>
              <GalaxyLayerBridgeProvider>
                <MobileGalaxyComposerOpenProvider>
                  <DashboardPagerProvider pageCount={pageCount}>
                    <DashboardPageSelectorProvider>
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
                                            {children}
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
                    </DashboardPageSelectorProvider>
                  </DashboardPagerProvider>
                </MobileGalaxyComposerOpenProvider>
              </GalaxyLayerBridgeProvider>
            </FeatureFlagsProvider>
          </CompanyWorkspaceProvider>
        </LoginOverlay>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
