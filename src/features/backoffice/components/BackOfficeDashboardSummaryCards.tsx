"use client";

import { Activity, CalendarClock, Euro, Sparkles } from "lucide-react";
import { formatBackOfficeDashboardEuro } from "@/features/backoffice/backOfficeDashboardFormat";

type Props = {
  completedCount: number;
  invoicedCount: number;
  revenueEstimateEuros: number;
  newRequestsCount: number;
};

export default function BackOfficeDashboardSummaryCards({
  completedCount,
  invoicedCount,
  revenueEstimateEuros,
  newRequestsCount,
}: Props) {
  return (
    <div className="grid shrink-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div
        data-testid="back-office-summary-completed"
        className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
        title="Interventions terminées aujourd'hui"
      >
        <div className="flex items-start justify-between gap-2">
          <Sparkles className="mt-0.5 h-[18px] w-[18px] text-emerald-600" aria-hidden />
          <p className="text-right text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
            {completedCount}
          </p>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Terminé
        </p>
        <p className="sr-only">{completedCount} terminées aujourd&apos;hui</p>
      </div>
      <div
        data-testid="back-office-summary-invoiced"
        className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
        title="Interventions facturées aujourd'hui"
      >
        <div className="flex items-start justify-between gap-2">
          <Euro className="mt-0.5 h-[18px] w-[18px] text-violet-600" aria-hidden />
          <p className="text-right text-3xl font-bold tabular-nums leading-none tracking-tight text-slate-900">
            {invoicedCount}
          </p>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Facturé
        </p>
        <p className="sr-only">{invoicedCount} facturées aujourd&apos;hui</p>
      </div>
      <div
        data-testid="back-office-summary-revenue"
        className="rounded-[18px] border border-black/[0.06] bg-white/90 px-3 py-3 shadow-[0_14px_36px_-18px_rgba(15,23,42,0.14)]"
        title="Chiffre d'affaires estimé sur la journée"
      >
        <div className="flex items-start justify-between gap-2">
          <Activity className="mt-0.5 h-[18px] w-[18px] text-sky-600" aria-hidden />
          <p className="text-right text-xl font-bold tabular-nums leading-none tracking-tight text-slate-900 sm:text-2xl">
            {formatBackOfficeDashboardEuro(revenueEstimateEuros)}
          </p>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          CA · jour
        </p>
        <p className="sr-only">
          Chiffre d&apos;affaires estimé pour aujourd&apos;hui&nbsp;:{" "}
          {formatBackOfficeDashboardEuro(revenueEstimateEuros)}
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
            {newRequestsCount}
          </p>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Nouveau
        </p>
        <p className="sr-only">{newRequestsCount} nouvelles demandes</p>
      </div>
    </div>
  );
}
