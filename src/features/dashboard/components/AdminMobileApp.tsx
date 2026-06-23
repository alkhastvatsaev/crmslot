"use client";

import dynamic from "next/dynamic";
import AdminMobileShell from "@/features/dashboard/components/AdminMobileShell";
import AdminMobileProviders from "@/features/dashboard/AdminMobileProviders";
import AdminMobileOfflineBar from "@/features/dashboard/components/AdminMobileOfflineBar";
import MobileShellFooterDock from "@/features/dashboard/components/MobileShellFooterDock";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
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
 * @deprecated Route `/m/admin` redirige vers `/` — conservé pour tests shell.
 */
export default function AdminMobileApp() {
  return (
    <AdminMobileProviders>
      <LayoutShellProvider mode="mobile">
        <MobileHubRailProvider>
          <AdminMobileShell dock={<MobileShellFooterDock />}>
            <AdminMobileOfflineBar />
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
              <ErrorBoundary name="admin-mobile-inbox">
                <MobileMapHubLite />
              </ErrorBoundary>
            </div>
          </AdminMobileShell>
        </MobileHubRailProvider>
      </LayoutShellProvider>
    </AdminMobileProviders>
  );
}
