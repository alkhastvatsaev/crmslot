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
import type { Intervention } from "@/features/interventions";
import { useTranslation } from "@/core/i18n/I18nContext";

function DonutChart({ slices }: { slices: { value: number; color: string; label: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return null;
  const R = 18,
    cx = 20,
    cy = 20,
    stroke = 8;
  const circ = 2 * Math.PI * R;
  const arcs = slices.reduce<{ dash: number; offset: number; color: string; label: string }[]>(
    (acc, sl) => {
      const dash = (sl.value / total) * circ;
      const prevOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
      return [...acc, { dash, offset: prevOffset, color: sl.color, label: sl.label }];
    },
    []
  );
  return (
    <svg width={40} height={40} viewBox="0 0 40 40" aria-label="Répartition statuts" role="img">
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      {arcs.map((arc) => (
        <circle
          key={arc.label}
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={arc.color}
          strokeWidth={stroke}
          strokeDasharray={`${arc.dash.toFixed(2)} ${(circ - arc.dash).toFixed(2)}`}
          strokeDashoffset={(-arc.offset + circ / 4).toFixed(2)}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

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

  const donutSlices = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayIvs = interventions.filter(
      (iv) => iv.scheduledDate === today || iv.createdAt?.startsWith(today)
    );
    const done = todayIvs.filter((iv) => iv.status === "done" || iv.status === "invoiced").length;
    const active = todayIvs.filter((iv) =>
      ["assigned", "en_route", "in_progress", "waiting_material"].includes(iv.status)
    ).length;
    const pending = todayIvs.filter((iv) => iv.status === "pending").length;
    const cancelled = todayIvs.filter((iv) => iv.status === "cancelled").length;
    return [
      { value: done, color: "#10b981", label: "done" },
      { value: active, color: "#3b82f6", label: "active" },
      { value: pending, color: "#f59e0b", label: "pending" },
      { value: cancelled, color: "#ef4444", label: "cancelled" },
    ];
  }, [interventions]);

  return (
    <div data-testid="daily-operations-kpi" className="space-y-4">
      {/* Completion rate bar + donut */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {t("backoffice.dashboard.kpi_completion_rate")}
          </span>
          <div className="flex items-center gap-3">
            <DonutChart slices={donutSlices} />
            <span className="text-[18px] font-black text-slate-900">{completionRate}%</span>
          </div>
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
