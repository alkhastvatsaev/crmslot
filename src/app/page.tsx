"use client";
import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import SpotlightSearch from "@/features/dashboard/components/SpotlightSearch";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import UserProfile from "@/features/dashboard/components/UserProfile";
import MacroDroidIndicator from "@/features/dashboard/components/MacroDroidIndicator";
import AutoProcessUploads from "@/features/dashboard/components/AutoProcessUploads";
import DashboardPager from "@/features/dashboard/components/DashboardPager";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";
import { OFFLINE_HUB_SLOT_INDEX } from "@/features/offline/offlineHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
import WorkspaceRequiredPanel from "@/features/app/WorkspaceRequiredPanel";
import DashboardDesktopShell from "@/features/dashboard/components/DashboardDesktopShell";
import MobileShell from "@/features/dashboard/components/MobileShell";
import AdminDashboardProviders from "@/features/dashboard/AdminDashboardProviders";
import { DASHBOARD_DESKTOP_COL_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { useAccountRole } from "@/features/auth/useAccountRole";
import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company/clientMobileAppConstants";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";

const MapboxView = dynamic(() => import("@/features/map/components/MapboxView"), {
  ssr: false,
  loading: () => (
    <main
      id="map-container"
      data-testid="map-container-loading"
      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center min-h-[320px] animate-pulse bg-slate-100`}
      aria-busy="true"
    />
  ),
});

const GmailHubPage = dynamic(() => import("@/features/gmail/components/GmailHubPage"), {
  ssr: false,
  loading: () => null,
});

const FeatureHubPage = dynamic(() => import("@/features/featureHub/components/FeatureHubPage"), {
  ssr: false,
  loading: () => null,
});

const CrmHistoryPage = dynamic(() => import("@/features/crmHistory/components/CrmHistoryPage"), {
  ssr: false,
  loading: () => null,
});

const BillingHubPage = dynamic(() => import("@/features/billingHub/components/BillingHubPage"), {
  ssr: false,
  loading: () => null,
});

const OfflineHubPage = dynamic(
  () => import("@/features/offline/components/TechnicianOfflineHubPage"),
  { ssr: false, loading: () => null }
);

const desktopHeader = (
  <>
    <aside
      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--left pointer-events-auto`}
    >
      <ClockCalendar />
    </aside>
    <div
      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center pointer-events-auto flex flex-col gap-2`}
    >
      <WorkspaceRequiredPanel />
      <SpotlightSearch />
    </div>
    <aside
      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--right pointer-events-auto`}
    >
      <UserProfile interactive />
    </aside>
  </>
);

/** Dashboard admin — 6 pages · client `/m/demande` · terrain `/m/technician`. */
export default function Dashboard() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const {
    isTechnicianAccount,
    isClientPortalAccount,
    isLoading: isAccountRoleLoading,
  } = useAccountRole();

  const satelliteAppRedirectPending =
    !isAccountRoleLoading &&
    isMobile === true &&
    !isCapacitorNative() &&
    (isTechnicianAccount || isClientPortalAccount);

  useEffect(() => {
    if (!satelliteAppRedirectPending) return;
    router.replace(isTechnicianAccount ? TECHNICIAN_MOBILE_APP_ROUTE : CLIENT_MOBILE_APP_ROUTE);
  }, [satelliteAppRedirectPending, isTechnicianAccount, router]);

  const dashboardPages = useMemo(
    () => [
      <ErrorBoundary key="map" name="map">
        <MapboxView />
        <MacroDroidIndicator />
        <AutoProcessUploads />
      </ErrorBoundary>,
      <ErrorBoundary key="feature-hub" name="feature-hub">
        <FeatureHubPage slotIndex={FEATURE_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="crm-history" name="crm-history">
        <CrmHistoryPage slotIndex={CRM_HISTORY_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="billing-hub" name="billing-hub">
        <BillingHubPage slotIndex={BILLING_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="gmail-hub" name="gmail-hub">
        <GmailHubPage slotIndex={GMAIL_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="offline-hub" name="offline-hub">
        <OfflineHubPage slotIndex={OFFLINE_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
    ],
    []
  );

  if (isAccountRoleLoading || satelliteAppRedirectPending) {
    return (
      <div
        data-testid="satellite-app-redirect-loading"
        className="flex min-h-dvh items-center justify-center bg-slate-50"
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"
          aria-hidden
        />
      </div>
    );
  }

  return (
    <AdminDashboardProviders pageCount={dashboardPages.length}>
      {isMobile === null ? (
        <div
          data-testid="mobile-detection-loading"
          className="flex min-h-dvh items-center justify-center bg-slate-50"
        >
          <div
            className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600"
            aria-hidden
          />
        </div>
      ) : isMobile ? (
        <LayoutShellProvider mode="mobile">
          <MobileShell pages={dashboardPages} />
        </LayoutShellProvider>
      ) : (
        <LayoutShellProvider mode="desktop">
          <DashboardDesktopShell
            header={desktopHeader}
            pager={<DashboardPager pages={dashboardPages} />}
            galaxy={<DashboardGalaxyLayer />}
          />
        </LayoutShellProvider>
      )}
    </AdminDashboardProviders>
  );
}
