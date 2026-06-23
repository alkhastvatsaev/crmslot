"use client";

import { LayoutShellProvider } from "@/context/LayoutShellContext";
import CompanyHubPage from "@/features/company/components/CompanyHubPage";
import ClientMobileShell from "@/features/company/components/ClientMobileShell";
import ClientMobileProviders from "@/features/company/ClientMobileProviders";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import { CLIENT_MOBILE_APP_SLOT_INDEX } from "@/features/company/clientMobileAppConstants";

/**
 * Portail client — formulaire, suivi, chat entreprise.
 * Route : `/m/demande`.
 */
export default function ClientMobileApp() {
  return (
    <ClientMobileProviders>
      <LayoutShellProvider mode="mobile">
        <MobileHubRailProvider>
          <ClientMobileShell>
            <ErrorBoundary name="client-mobile-hub">
              <div
                data-testid={`client-mobile-page-${CLIENT_MOBILE_APP_SLOT_INDEX}`}
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <CompanyHubPage />
              </div>
            </ErrorBoundary>
          </ClientMobileShell>
        </MobileHubRailProvider>
      </LayoutShellProvider>
    </ClientMobileProviders>
  );
}
