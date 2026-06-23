"use client";

import dynamic from "next/dynamic";
import AdminMobileShell from "@/features/dashboard/components/AdminMobileShell";
import AdminMobileProviders from "@/features/dashboard/AdminMobileProviders";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";

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
  return (
    <AdminMobileProviders>
      <LayoutShellProvider mode="mobile">
        <AdminMobileShell>
          <ErrorBoundary name="admin-mobile-inbox">
            <MobileMapHubLite />
          </ErrorBoundary>
        </AdminMobileShell>
      </LayoutShellProvider>
    </AdminMobileProviders>
  );
}
