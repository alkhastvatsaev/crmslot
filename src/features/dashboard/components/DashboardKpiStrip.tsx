import React from 'react';
import { useTranslation } from '@/core/i18n/I18nContext';

interface DashboardKpiStripProps {
  pending: number;
  inProgress: number;
  done: number;
}

export default function DashboardKpiStrip({ pending, inProgress, done }: DashboardKpiStripProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-label={t('dashboard.kpi_strip_aria')}
      className="flex flex-wrap items-center gap-2 px-4 py-2"
    >
      <span
        data-testid="kpi-pending"
        className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-amber-50 text-amber-600 border border-amber-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        {t('dashboard.kpi_pending')}
        <span>{pending}</span>
      </span>

      <span
        data-testid="kpi-in-progress"
        className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-blue-50 text-blue-600 border border-blue-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
        {t('dashboard.kpi_in_progress')}
        <span>{inProgress}</span>
      </span>

      <span
        data-testid="kpi-done"
        className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        {t('dashboard.kpi_done')}
        <span>{done}</span>
      </span>
    </div>
  );
}
