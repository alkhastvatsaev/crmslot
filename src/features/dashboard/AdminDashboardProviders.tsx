"use client";

import type { ReactNode } from "react";
import LoginOverlay from "@/features/auth/components/LoginOverlay";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { BackofficeInboxIntentProvider } from "@/context/BackofficeInboxIntentContext";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";
import { CompanyStockAgentBridgeProvider } from "@/context/CompanyStockAgentBridgeContext";
import { CrmHistoryAgentBridgeProvider } from "@/context/CrmHistoryAgentBridgeContext";
import { BillingHubAgentBridgeProvider } from "@/context/BillingHubAgentBridgeContext";
import { PwaCopilotAgentBridgeProvider } from "@/context/PwaCopilotAgentBridgeContext";
import { BillingHubIntentProvider } from "@/context/BillingHubIntentContext";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import DevPreviewAnonymousAuth from "@/features/dev/DevPreviewAnonymousAuth";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import { TechnicianBackofficeReportBridgeProvider } from "@/context/TechnicianBackofficeReportBridgeContext";
import ActivityLogPageObserver from "@/features/crmHistory/components/ActivityLogPageObserver";
import AuthActivityLogger from "@/features/crmHistory/components/AuthActivityLogger";

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
          <DevPreviewAnonymousAuth />
          <CompanyWorkspaceProvider>
            <GalaxyLayerBridgeProvider>
              <DashboardPagerProvider pageCount={pageCount}>
                <DashboardPageSelectorProvider>
                  <ChatbotProvider>
                    <BackofficeInboxIntentProvider>
                      <CompanyStockIntentProvider>
                        <CompanyStockAgentBridgeProvider>
                          <CrmHistoryAgentBridgeProvider>
                            <BillingHubAgentBridgeProvider>
                              <PwaCopilotAgentBridgeProvider>
                                <BillingHubIntentProvider>
                                  <TechnicianBackofficeReportBridgeProvider>
                                    <OfflineSyncProvider>
                                      <AuthActivityLogger />
                                      <ActivityLogPageObserver />
                                      {children}
                                    </OfflineSyncProvider>
                                  </TechnicianBackofficeReportBridgeProvider>
                                </BillingHubIntentProvider>
                              </PwaCopilotAgentBridgeProvider>
                            </BillingHubAgentBridgeProvider>
                          </CrmHistoryAgentBridgeProvider>
                        </CompanyStockAgentBridgeProvider>
                      </CompanyStockIntentProvider>
                    </BackofficeInboxIntentProvider>
                  </ChatbotProvider>
                </DashboardPageSelectorProvider>
              </DashboardPagerProvider>
            </GalaxyLayerBridgeProvider>
          </CompanyWorkspaceProvider>
        </LoginOverlay>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
