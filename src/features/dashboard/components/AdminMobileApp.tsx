"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import AdminMobileShell from "@/features/dashboard/components/AdminMobileShell";
import AdminMobileProviders from "@/features/dashboard/AdminMobileProviders";
import AdminMobileOfflineBar from "@/features/dashboard/components/AdminMobileOfflineBar";
import AdminMobileFooterDock from "@/features/dashboard/components/AdminMobileFooterDock";
import MapMobileDispatchArmButton from "@/features/map/components/MapMobileDispatchArmButton";
import { buildFullCrmMobileHref } from "@/features/dashboard/adminMobileFullCrm";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import { useFeatureFlag } from "@/core/useFeatureFlags";

const MobileMapHubLite = dynamic(() => import("@/features/map/components/MobileMapHubLite"), {
  ssr: false,
  loading: () => (
    <div
      data-testid="admin-mobile-inbox-loading"
      className="flex min-h-[240px] flex-1 items-center justify-center bg-slate-50 text-sm text-slate-500"
      aria-busy="true"
    />
  ),
});

/**
 * App admin mobile — missions + inbox (carte lite).
 * Route : `/m/admin`
 */
export default function AdminMobileApp() {
  const dispatchVoice = useFeatureFlag("dispatchVoice");

  return (
    <AdminMobileProviders>
      <LayoutShellProvider mode="mobile">
        <AdminMobileShell
          footer={
            <div className="flex w-full flex-col gap-2">
              {dispatchVoice ? (
                <div className="relative min-h-[var(--mobile-galaxy-height,3.5rem)] w-full flex-1">
                  <AdminMobileFooterDock />
                </div>
              ) : null}
              <Link
                href={buildFullCrmMobileHref()}
                className="flex min-h-[2.75rem] w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 active:bg-white/15"
                data-testid="admin-mobile-full-crm-link"
              >
                CRM complet
              </Link>
            </div>
          }
        >
          <AdminMobileOfflineBar />
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <ErrorBoundary name="admin-mobile-inbox">
              <MobileMapHubLite />
            </ErrorBoundary>
            <MapMobileDispatchArmButton />
          </div>
        </AdminMobileShell>
      </LayoutShellProvider>
    </AdminMobileProviders>
  );
}
