"use client";

import type { ReactNode } from "react";
import TechnicianLoginGate from "@/features/auth/components/TechnicianLoginGate";
import DesktopOnlyGate from "@/features/app/DesktopOnlyGate";
import { DateProvider } from "@/context/DateContext";
import { CompanyWorkspaceProvider } from "@/context/CompanyWorkspaceContext";
import { TechnicianCaseIntentProvider } from "@/context/TechnicianCaseIntentContext";
import { TechnicianFinishJobProvider } from "@/context/TechnicianFinishJobContext";
import { TechnicianQueryProvider } from "@/features/offline/TechnicianQueryProvider";
import { OfflineSyncProvider } from "@/context/OfflineSyncContext";
import TechnicianNotificationBootstrap from "@/features/notifications/components/TechnicianNotificationBootstrap";
import DevServiceWorkerCleanup from "@/features/dev/DevServiceWorkerCleanup";
import { GalaxyLayerBridgeProvider } from "@/features/map/GalaxyLayerBridgeContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { ChatbotProvider } from "@/features/chatbot/ChatbotContext";
import AndroidAppInstallPromoBootstrap from "@/core/pwa/AndroidAppInstallPromoBootstrap";

const TECHNICIAN_MOBILE_PAGE_COUNT = 1;

type Props = {
  children: ReactNode;
};

/** Providers app terrain — importé par `/m/technician` uniquement. */
export default function TechnicianMobileProviders({ children }: Props) {
  return (
    <DateProvider>
      <DesktopOnlyGate>
        <DevServiceWorkerCleanup />
        <AndroidAppInstallPromoBootstrap surface="technician" presentation="toast" />
        <CompanyWorkspaceProvider>
          <GalaxyLayerBridgeProvider>
            <DashboardPagerProvider pageCount={TECHNICIAN_MOBILE_PAGE_COUNT}>
              <DashboardPageSelectorProvider>
                <ChatbotProvider>
                  <TechnicianQueryProvider>
                    <OfflineSyncProvider>
                      <TechnicianCaseIntentProvider>
                        <TechnicianFinishJobProvider>
                          <TechnicianNotificationBootstrap />
                          <TechnicianLoginGate>{children}</TechnicianLoginGate>
                        </TechnicianFinishJobProvider>
                      </TechnicianCaseIntentProvider>
                    </OfflineSyncProvider>
                  </TechnicianQueryProvider>
                </ChatbotProvider>
              </DashboardPageSelectorProvider>
            </DashboardPagerProvider>
          </GalaxyLayerBridgeProvider>
        </CompanyWorkspaceProvider>
      </DesktopOnlyGate>
    </DateProvider>
  );
}
