"use client";
import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";
import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
import { CASE_HUB_SLOT_INDEX } from "@/features/caseHub/caseHubConstants";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";
import { PLANNING_HUB_SLOT_INDEX } from "@/features/planningHub/planningHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { DASHBOARD_DESKTOP_COL_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { useAccountRole } from "@/features/auth/useAccountRole";
import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company/clientMobileAppConstants";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";

const AdminDashboardProviders = dynamic(
  () => import("@/features/dashboard/AdminDashboardProviders"),
  { ssr: false, loading: () => null }
);

const MobileShell = dynamic(() => import("@/features/dashboard/components/MobileShell"), {
  ssr: false,
  loading: () => null,
});

const DashboardDesktopShell = dynamic(
  () => import("@/features/dashboard/components/DashboardDesktopShell"),
  { ssr: false, loading: () => null }
);

const DashboardPager = dynamic(() => import("@/features/dashboard/components/DashboardPager"), {
  ssr: false,
  loading: () => null,
});

const DashboardGalaxyLayer = dynamic(
  () => import("@/features/map/components/DashboardGalaxyLayer"),
  { ssr: false, loading: () => null }
);

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

const MacroDroidIndicator = dynamic(
  () => import("@/features/dashboard/components/MacroDroidIndicator"),
  { ssr: false, loading: () => null }
);

const AutoProcessUploads = dynamic(
  () => import("@/features/dashboard/components/AutoProcessUploads"),
  { ssr: false, loading: () => null }
);

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

const GmailHubPage = dynamic(() => import("@/features/gmail/components/GmailHubPage"), {
  ssr: false,
  loading: () => null,
});

const TeamHubPage = dynamic(() => import("@/features/teamHub/components/TeamHubPage"), {
  ssr: false,
  loading: () => null,
});

const CaseHubPage = dynamic(() => import("@/features/caseHub/components/CaseHubPage"), {
  ssr: false,
  loading: () => null,
});

const CommissionsHubPage = dynamic(
  () => import("@/features/commissionsHub/components/CommissionsHubPage"),
  { ssr: false, loading: () => null }
);

const PlanningHubPage = dynamic(() => import("@/features/planningHub/components/PlanningHubPage"), {
  ssr: false,
  loading: () => null,
});

/** Dashboard admin — 9 pages · client `/m/demande` · terrain `/m/technician`. */
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
      <ErrorBoundary key="team-hub" name="team-hub">
        <TeamHubPage slotIndex={TEAM_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="case-hub" name="case-hub">
        <CaseHubPage slotIndex={CASE_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="commissions-hub" name="commissions-hub">
        <CommissionsHubPage slotIndex={COMMISSIONS_HUB_SLOT_INDEX} />
      </ErrorBoundary>,
      <ErrorBoundary key="planning-hub" name="planning-hub">
        <PlanningHubPage slotIndex={PLANNING_HUB_SLOT_INDEX} />
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
            pager={<DashboardPager pages={dashboardPages} />}
            galaxy={<DashboardGalaxyLayer />}
          />
        </LayoutShellProvider>
      )}
    </AdminDashboardProviders>
  );
}
