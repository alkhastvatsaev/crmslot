import React from 'react';

interface DashboardKpiStripProps {
  pending: number;
  inProgress: number;
  done: number;
}

export default function DashboardKpiStrip({ pending, inProgress, done }: DashboardKpiStripProps) {
  return (
    <div
      role="status"
      aria-label="Résumé des interventions du jour"
      className="flex flex-wrap items-center gap-2 px-4 py-2"
    >
      <span
        data-testid="kpi-pending"
        className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        En attente
        <span>{pending}</span>
      </span>

      <span
        data-testid="kpi-in-progress"
        className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
        En cours
        <span>{inProgress}</span>
      </span>

      <span
        data-testid="kpi-done"
        className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        Terminées
        <span>{done}</span>
      </span>
    </div>
  );
}
