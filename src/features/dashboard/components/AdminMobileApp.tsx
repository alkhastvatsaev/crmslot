"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AdminMobileShell from "@/features/dashboard/components/AdminMobileShell";
import AdminMobileProviders from "@/features/dashboard/AdminMobileProviders";
import AdminMobileOfflineBar from "@/features/dashboard/components/AdminMobileOfflineBar";
import MobileShellFooterDock from "@/features/dashboard/components/MobileShellFooterDock";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import { buildFullCrmMobileHref } from "@/features/dashboard/adminMobileFullCrm";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { ErrorBoundary } from "@/core/ui/ErrorBoundary";
import { useTranslation } from "@/core/i18n/I18nContext";

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
  const { t } = useTranslation();
  const fullCrmLabel = String(t("admin_mobile.full_crm_link"));

  return (
    <AdminMobileProviders>
      <LayoutShellProvider mode="mobile">
        <MobileHubRailProvider>
          <AdminMobileShell
            dock={<MobileShellFooterDock />}
            footerExtra={
              <Link
                href={buildFullCrmMobileHref()}
                aria-label={fullCrmLabel}
                className="group flex min-h-[2.75rem] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/90 transition-all duration-150 hover:border-white/25 hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                data-testid="admin-mobile-full-crm-link"
              >
                <span>{fullCrmLabel}</span>
                <ArrowUpRight
                  className="h-3.5 w-3.5 opacity-70 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
            }
          >
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
