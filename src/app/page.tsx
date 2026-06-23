"use client";
import React, { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  MacroDroidIndicator,
  AutoProcessUploads,
  DashboardPager,
  DashboardDesktopShell,
  MobileShell,
  AdminDashboardProviders,
  useIsMobile,
} from "@/features/dashboard";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail";
import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub";
import { CASE_HUB_SLOT_INDEX } from "@/features/caseHub";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub";
import { PLANNING_HUB_SLOT_INDEX } from "@/features/planningHub";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub";
import { DashboardGalaxyLayer } from "@/features/map";
import { DASHBOARD_DESKTOP_COL_CLASS } from "@/core/ui/dashboardDesktopLayout";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import { isCapacitorNative } from "@/core/native/capacitorRuntime";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { useAccountRole } from "@/features/auth";
import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions";
import { ADMIN_MOBILE_APP_ROUTE } from "@/features/dashboard/adminMobileAppConstants";

const MapPageSlot = dynamic(() => import("@/features/map").then((m) => m.MapPageSlot), {
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

/** Dashboard admin — 9 pages desktop · satellites `/m/admin` · `/m/demande` · `/m/technician`. */
export default function Dashboard() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const {
    isTechnicianAccount,
    isClientPortalAccount,
    isCrmTenantAccount,
    isLoading: isAccountRoleLoading,
  } = useAccountRole();

  const satelliteAppRedirectPending =
    !isAccountRoleLoading &&
    isMobile === true &&
    !isCapacitorNative() &&
    (isTechnicianAccount || isClientPortalAccount || isCrmTenantAccount);

  useEffect(() => {
    if (!satelliteAppRedirectPending) return;
    const route = isTechnicianAccount
      ? TECHNICIAN_MOBILE_APP_ROUTE
      : isClientPortalAccount
        ? CLIENT_MOBILE_APP_ROUTE
        : ADMIN_MOBILE_APP_ROUTE;
    router.replace(route);
  }, [satelliteAppRedirectPending, isTechnicianAccount, isClientPortalAccount, router]);

  const dashboardPages = useMemo(
    () => [
      <ErrorBoundary key="map" name="map">
        <MapPageSlot />
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
