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
} from "lucide-react";
import type { Intervention } from "@/features/interventions/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  interventions: Intervention[];
};

interface KpiCard {
  label: string;
  value: number;
  icon: typeof Clock;
  color: string;
  bgColor: string;
}

export default function DailyOperationsKpi({ interventions }: Props) {
  const kpis = useMemo<KpiCard[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayInterventions = interventions.filter(
      (iv) => iv.scheduledDate === today || iv.createdAt?.startsWith(today),
    );

    const byStatus = (statuses: Intervention["status"][]) =>
      todayInterventions.filter((iv) => statuses.includes(iv.status)).length;

    return [
      {
        label: "Total aujourd'hui",
        value: todayInterventions.length,
        icon: TrendingUp,
        color: "text-slate-700",
        bgColor: "bg-slate-100",
      },
      {
        label: "En attente",
        value: byStatus(["pending", "pending_needs_address", "assigned"]),
        icon: Clock,
        color: "text-blue-700",
        bgColor: "bg-blue-50",
      },
      {
        label: "En route",
        value: byStatus(["en_route"]),
        icon: Truck,
        color: "text-indigo-700",
        bgColor: "bg-indigo-50",
      },
      {
        label: "En cours",
        value: byStatus(["in_progress"]),
        icon: Wrench,
        color: "text-amber-700",
        bgColor: "bg-amber-50",
      },
      {
        label: "Attente matériel",
        value: byStatus(["waiting_material"]),
        icon: AlertTriangle,
        color: "text-orange-700",
        bgColor: "bg-orange-50",
      },
      {
        label: "Terminées",
        value: byStatus(["done", "invoiced"]),
        icon: CheckCircle2,
        color: "text-emerald-700",
        bgColor: "bg-emerald-50",
      },
      {
        label: "Annulées",
        value: byStatus(["cancelled"]),
        icon: Ban,
        color: "text-red-600",
        bgColor: "bg-red-50",
      },
      {
        label: "Facturées",
        value: byStatus(["invoiced"]),
        icon: FileText,
        color: "text-green-700",
        bgColor: "bg-green-50",
      },
    ];
  }, [interventions]);

  const completionRate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayIvs = interventions.filter(
      (iv) => iv.scheduledDate === today || iv.createdAt?.startsWith(today),
    );
    if (todayIvs.length === 0) return 0;
    const completed = todayIvs.filter(
      (iv) => iv.status === "done" || iv.status === "invoiced",
    ).length;
    return Math.round((completed / todayIvs.length) * 100);
  }, [interventions]);

  return (
    <div data-testid="daily-operations-kpi" style={outfit} className="space-y-4">
      {/* Completion rate bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Taux de complétion
          </span>
          <span className="text-[18px] font-black text-slate-900">
            {completionRate}%
          </span>
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
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 ${kpi.color}`}>
              <kpi.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className={`text-[18px] font-black leading-none ${kpi.color}`}>
                {kpi.value}
              </div>
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
