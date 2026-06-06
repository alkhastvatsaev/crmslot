"use client";

import { useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Wrench,
  Ban,
  FileText,
  TrendingUp,
  Banknote,
  Hourglass,
} from "lucide-react";
import type { Intervention } from "@/features/interventions/types";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  interventions: Intervention[];
};

interface KpiCard {
  label: string;
  value: string | number;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}

export default function DailyOperationsKpi({ interventions }: Props) {
  const { t } = useTranslation();
  const kpis = useMemo<KpiCard[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayInterventions = interventions.filter(
      (iv) => iv.scheduledDate === today || iv.createdAt?.startsWith(today)
    );

    const byStatus = (statuses: Intervention["status"][]) =>
      todayInterventions.filter((iv) => statuses.includes(iv.status)).length;

    const revenueCents = todayInterventions
      .filter((iv) => iv.status === "invoiced" || iv.status === "done")
      .reduce((sum, iv) => sum + (iv.invoiceAmountCents || 0), 0);
    const revenueEuro = (revenueCents / 100).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });

    const durationIvs = todayInterventions.filter(
      (iv) => iv.actualDurationMinutes != null && iv.actualDurationMinutes > 0
    );
    const avgDuration =
      durationIvs.length > 0
        ? Math.round(
            durationIvs.reduce((sum, iv) => sum + (iv.actualDurationMinutes || 0), 0) /
              durationIvs.length
          )
        : 0;

    return [
      {
        label: t("backoffice.dashboard.kpi_revenue_today") || "CA du jour",
        value: revenueEuro,
        icon: Banknote,
        color: "text-emerald-700",
        bgColor: "bg-emerald-100",
      },
      {
        label: t("backoffice.dashboard.kpi_avg_duration") || "Temps moyen",
        value: `${avgDuration} min`,
        icon: Hourglass,
        color: "text-purple-700",
        bgColor: "bg-purple-100",
      },
      {
        label: t("backoffice.dashboard.kpi_total_today"),
        value: todayInterventions.length,
        icon: TrendingUp,
        color: "text-slate-700",
        bgColor: "bg-slate-100",
      },

      {
        label: t("backoffice.dashboard.kpi_en_route"),
        value: byStatus(["en_route"]),
        icon: Truck,
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
      },

      {
        label: t("backoffice.dashboard.kpi_waiting_material"),
        value: byStatus(["waiting_material"]),
        icon: AlertTriangle,
        color: "text-orange-700",
        bgColor: "bg-orange-50",
      },

      {
        label: t("backoffice.dashboard.kpi_cancelled"),
        value: byStatus(["cancelled"]),
        icon: Ban,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        label: t("backoffice.dashboard.kpi_invoiced"),
        value: byStatus(["invoiced"]),
        icon: FileText,
        color: "text-green-700",
        bgColor: "bg-green-50",
      },
    ];
  }, [interventions, t]);

  const completionRate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayIvs = interventions.filter(
      (iv) => iv.scheduledDate === today || iv.createdAt?.startsWith(today)
    );
    if (todayIvs.length === 0) return 0;
    const completed = todayIvs.filter(
      (iv) => iv.status === "done" || iv.status === "invoiced"
    ).length;
    return Math.round((completed / todayIvs.length) * 100);
  }, [interventions]);

  return (
    <div data-testid="daily-operations-kpi" className="space-y-4">
      {/* Completion rate bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {t("backoffice.dashboard.kpi_completion_rate")}
          </span>
          <span className="text-[18px] font-black text-slate-900">{completionRate}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-2">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`flex items-center gap-3 rounded-xl ${kpi.bgColor} px-3 py-3 transition-transform hover:scale-[1.02]`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 ${kpi.color}`}
            >
              <kpi.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className={`text-[18px] font-black leading-none ${kpi.color}`}>{kpi.value}</div>
              <div className="mt-0.5 text-[10px] font-bold text-slate-500 truncate">
                {kpi.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
