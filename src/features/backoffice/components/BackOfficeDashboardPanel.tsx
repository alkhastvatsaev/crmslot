"use client";

import {
  Activity,
  AlertCircle,
  Building2,
  CalendarClock,
  Euro,
  LayoutDashboard,
  Sparkles,
  UserRound,
} from "lucide-react";
import { GLASS_PANEL_BODY_SCROLL_COMPACT } from "@/core/ui/glassPanelChrome";
import { auth, isConfigured, firestore } from "@/core/config/firebase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import { backofficeBucketLabel } from "@/features/backoffice/backofficeBuckets";
import { type BackofficeViewFilters } from "@/features/backoffice/backofficeFilters";
import DailyOperationsKpi from "@/features/backoffice/components/DailyOperationsKpi";
import BackOfficeDetailDrawer from "@/features/backoffice/components/BackOfficeDetailDrawer";
import BackOfficeInterventionsTable from "@/features/backoffice/components/BackOfficeInterventionsTable";
import { useBackOfficeDashboard } from "@/features/backoffice/hooks/useBackOfficeDashboard";
import type { Technician } from "@/features/technicians/types";

const selectClass =
  "flex h-10 w-full cursor-pointer appearance-none rounded-[14px] border border-black/[0.06] bg-white/95 py-2 pl-3 pr-3 text-sm font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15";

const dateInputClass =
  "flex h-10 w-full rounded-[14px] border border-black/[0.06] bg-white/95 px-3 text-sm font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15";

function technicianOptionLabel(uid: string, technicians: Technician[]): string {
  const tech = technicians.find((x) => x.id === uid);
  return tech?.name?.trim() ? `${tech.name} (${uid.slice(0, 6)}…)` : uid;
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(n);
}

export default function BackOfficeDashboardPanel() {
  const { t } = useTranslation();
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
    return (
      <div
        data-testid="back-office-gate"
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit] px-4 py-6"
      >
        <div
          className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-2 rounded-[16px] border border-amber-200/50 bg-amber-50/80 px-4 py-5 text-[13px] shadow-[0_14px_36px_-18px_rgba(15,23,42,0.12)]"
          aria-labelledby="backoffice-gate-title"
        >
          <p id="backoffice-gate-title" className="sr-only">
            Invitation société requise pour le tableau des interventions.
          </p>
          <Building2 className="h-14 w-14 text-amber-700" aria-hidden />
        </div>
      </div>
    );
  }

  const ws = workspace;

  return (
    <div
      data-testid="back-office-dashboard"
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]"
    >
      <div className={cn(GLASS_PANEL_BODY_SCROLL_COMPACT, "flex min-h-0 flex-1 flex-col gap-3")}>
        {/* Header */}
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

        {/* Status banners */}
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

        {/* KPI summary cards */}
        <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <div
            data-testid="back-office-summary-completed"
            className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
            title="Interventions terminées aujourd'hui"
          >
            <div className="flex items-start justify-between gap-2">
              <Sparkles className="mt-0.5 h-[18px] w-[18px] text-emerald-600" aria-hidden />
              <p className="text-right text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
                {summary.completedCount}
              </p>
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Terminé
            </p>
            <p className="sr-only">{summary.completedCount} terminées aujourd&apos;hui</p>
          </div>
          <div
            data-testid="back-office-summary-invoiced"
            className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
            title="Interventions facturées aujourd'hui"
          >
            <div className="flex items-start justify-between gap-2">
              <Euro className="mt-0.5 h-[18px] w-[18px] text-violet-600" aria-hidden />
              <p className="text-right text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
                {summary.invoicedCount}
              </p>
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Facturé
            </p>
            <p className="sr-only">{summary.invoicedCount} facturées aujourd&apos;hui</p>
          </div>
          <div
            data-testid="back-office-summary-revenue"
            className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
            title="Chiffre d'affaires estimé sur la journée"
          >
            <div className="flex items-start justify-between gap-2">
              <Activity className="mt-0.5 h-[18px] w-[18px] text-sky-600" aria-hidden />
              <p className="text-right text-xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl">
                {formatEuro(summary.revenueEstimateEuros)}
              </p>
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              CA · jour
            </p>
            <p className="sr-only">
              Chiffre d&apos;affaires estimé pour aujourd&apos;hui&nbsp;:{" "}
              {formatEuro(summary.revenueEstimateEuros)}
            </p>
          </div>
          <div
            data-testid="back-office-summary-new"
            className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
            title="Nouvelles demandes sur la journée"
          >
            <div className="flex items-start justify-between gap-2">
              <CalendarClock className="mt-0.5 h-[18px] w-[18px] text-amber-600" aria-hidden />
              <p className="text-right text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
                {summary.newRequestsCount}
              </p>
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Nouveau
            </p>
            <p className="sr-only">{summary.newRequestsCount} nouvelles demandes</p>
          </div>
        </div>

        {tenantReady && !loading ? <DailyOperationsKpi interventions={interventions} /> : null}

        {/* Filters */}
        <div
          className="shrink-0 rounded-[16px] border border-black/[0.06] bg-white/90 px-2 py-2 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
          aria-label="Filtres dossiers"
        >
          <h3 className="sr-only">Filtres colonnes dossiers</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="back-office-filter-window" className="sr-only">
                Période
              </Label>
              <select
                id="back-office-filter-window"
                data-testid="back-office-filter-window"
                className={selectClass}
                value={filters.activityWindow}
                onChange={(e) =>
                  setWindow(e.target.value as BackofficeViewFilters["activityWindow"])
                }
              >
                <option value="all">Dates · tout</option>
                <option value="today">Aujourd&apos;hui</option>
                <option value="week">Semaine</option>
                <option value="custom">Plage</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="back-office-filter-company" className="sr-only">
                Société
              </Label>
              <select
                id="back-office-filter-company"
                data-testid="back-office-filter-company"
                className={selectClass}
                value={companyFilterId}
                onChange={(e) => {
                  const id = e.target.value;
                  setCompanyFilterId(id);
                  ws.setActiveCompanyId(id);
                }}
              >
                {ws.memberships.map((m) => (
                  <option key={m.companyId} value={m.companyId}>
                    {m.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="back-office-filter-tech" className="sr-only">
                Technicien
              </Label>
              <select
                id="back-office-filter-tech"
                data-testid="back-office-filter-tech"
                className={selectClass}
                value={filters.technicianUid}
                onChange={(e) => setFilters((p) => ({ ...p, technicianUid: e.target.value }))}
              >
                <option value="">Techniciens · tout</option>
                {techUids.map((uid) => (
                  <option key={uid} value={uid}>
                    {technicianOptionLabel(uid, technicians)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="back-office-filter-status" className="sr-only">
                Statut
              </Label>
              <select
                id="back-office-filter-status"
                data-testid="back-office-filter-status"
                className={selectClass}
                value={filters.statusBucket}
                onChange={(e) =>
                  setFilters((p) => ({
                    ...p,
                    statusBucket: e.target.value as BackofficeViewFilters["statusBucket"],
                  }))
                }
              >
                <option value="">Statuts · tout</option>
                {(["pending", "in_progress", "done", "invoiced"] as const).map((b) => (
                  <option key={b} value={b}>
                    {backofficeBucketLabel(b)}
                  </option>
                ))}
              </select>
            </div>
            {filters.activityWindow === "custom" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="back-office-filter-from" className="sr-only">
                    Du
                  </Label>
                  <Input
                    id="back-office-filter-from"
                    data-testid="back-office-filter-from"
                    type="date"
                    className={dateInputClass}
                    value={filters.dateFrom}
                    onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="back-office-filter-to" className="sr-only">
                    Au
                  </Label>
                  <Input
                    id="back-office-filter-to"
                    data-testid="back-office-filter-to"
                    type="date"
                    className={dateInputClass}
                    value={filters.dateTo}
                    onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Interventions table */}
        <div className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-[22px] border border-black/[0.06] bg-white/90 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]">
          {loading && tenantReady ? (
            <div data-testid="back-office-loading" className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-slate-200/55"
                  aria-hidden
                />
              ))}
            </div>
          ) : null}
          {!loading && tenantReady && filteredSorted.length === 0 ? (
            <div
              data-testid="back-office-empty"
              className="flex flex-1 flex-col items-center justify-center rounded-[inherit] px-5 py-8 text-center"
              aria-label="Aucune intervention"
            >
              <UserRound className="mb-1 h-12 w-12 text-slate-300" aria-hidden />
              <p className="sr-only">Aucune intervention ne correspond aux filtres.</p>
            </div>
          ) : null}
          {!loading && filteredSorted.length > 0 ? (
            <div className="min-h-0 flex-1 overflow-auto">
              <BackOfficeInterventionsTable
                rows={filteredSorted}
                technicians={technicians}
                onRowClick={setDetail}
                onDelete={(id) => {
                  void handleDelete(id);
                }}
              />
            </div>
          ) : null}
        </div>
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
