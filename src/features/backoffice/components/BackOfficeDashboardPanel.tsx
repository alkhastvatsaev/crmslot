"use client";

import { AlertCircle, LayoutDashboard } from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { auth, isConfigured, firestore } from "@/core/config/firebase";
import { cn } from "@/lib/utils";
import BackOfficeDashboardFilters from "@/features/backoffice/components/BackOfficeDashboardFilters";
import BackOfficeDashboardGate from "@/features/backoffice/components/BackOfficeDashboardGate";
import BackOfficeDashboardSummaryCards from "@/features/backoffice/components/BackOfficeDashboardSummaryCards";
import BackOfficeDashboardTableSection from "@/features/backoffice/components/BackOfficeDashboardTableSection";
import BackOfficeDetailDrawer from "@/features/backoffice/components/BackOfficeDetailDrawer";
import DailyOperationsKpi from "@/features/backoffice/components/DailyOperationsKpi";
import { useBackOfficeDashboard } from "@/features/backoffice/hooks/useBackOfficeDashboard";

export default function BackOfficeDashboardPanel() {
  const {
    workspace,
    filters,
    setFilters,
    companyFilterId,
    setCompanyFilterId,
    detail,
    setDetail,
    tenantReady,
    interventions,
    loading,
    error,
    technicians,
    summary,
    filteredSorted,
    techUids,
    handleDelete,
    handleArchive,
    setWindow,
  } = useBackOfficeDashboard();

  const offlineAuth = !isConfigured || !firestore;

  if (!workspace || !workspace.isTenantUser || !workspace.memberships.length) {
    return <BackOfficeDashboardGate />;
  }

  const ws = workspace;

  return (
    <div
      data-testid="back-office-dashboard"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
    >
      <div className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex min-h-0 flex-1 flex-col gap-3")}>
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-slate-900 text-white shadow-md">
              <LayoutDashboard className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold tracking-tight text-slate-900">
                Dossiers
              </h2>
              <p className="sr-only">Interventions société — tableau et filtres</p>
            </div>
          </div>
          {!offlineAuth && tenantReady ? (
            <div
              className="flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/90 px-3 py-2"
              role="status"
              aria-label="Flux en direct"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="sr-only">Live</span>
            </div>
          ) : null}
        </div>

        {offlineAuth ? (
          <div
            role="status"
            className="flex items-center gap-2 rounded-[14px] border border-amber-200/50 bg-amber-50/80 px-3 py-2 text-[12px] font-semibold text-amber-950"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <span>Connexion requise</span>
          </div>
        ) : null}
        {!offlineAuth && !auth?.currentUser ? (
          <p
            data-testid="back-office-login-hint"
            className="text-[12px] font-medium text-slate-600"
          >
            Connectez-vous.
          </p>
        ) : null}
        {error ? (
          <p
            data-testid="back-office-error"
            className="rounded-xl border border-rose-200/60 bg-rose-50/90 px-3 py-3 text-[13px] font-medium text-rose-900"
          >
            {error}
          </p>
        ) : null}

        <BackOfficeDashboardSummaryCards
          completedCount={summary.completedCount}
          invoicedCount={summary.invoicedCount}
          revenueEstimateEuros={summary.revenueEstimateEuros}
          newRequestsCount={summary.newRequestsCount}
        />

        {tenantReady && !loading ? <DailyOperationsKpi interventions={interventions} /> : null}

        <BackOfficeDashboardFilters
          filters={filters}
          setFilters={setFilters}
          companyFilterId={companyFilterId}
          setCompanyFilterId={setCompanyFilterId}
          memberships={ws.memberships}
          onActiveCompanyChange={ws.setActiveCompanyId}
          techUids={techUids}
          technicians={technicians}
          setWindow={setWindow}
        />

        <BackOfficeDashboardTableSection
          loading={loading}
          tenantReady={tenantReady}
          rows={filteredSorted}
          technicians={technicians}
          onRowClick={setDetail}
          onDelete={handleDelete}
        />
      </div>

      {detail ? (
        <BackOfficeDetailDrawer
          intervention={detail}
          technicians={technicians}
          isAdmin={ws.activeRole === "admin"}
          onClose={() => setDetail(null)}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      ) : null}
    </div>
  );
}
