"use client";

import { useMemo } from "react";
import {
  Trophy,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Star,
  Banknote,
  Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Intervention } from "@/features/interventions/types";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;

type Props = {
  interventions: Intervention[];
  technicianUid: string;
  technicianName: string;
};

interface TechMetrics {
  totalAssigned: number;
  completed: number;
  cancelled: number;
  waitingMaterial: number;
  completionRate: number;
  avgResponseMinutes: number | null;
  todayCompleted: number;
  thisWeekCompleted: number;
  revenueCents: number;
  commissionCents: number;
}

function computeMetrics(
  interventions: Intervention[],
  technicianUid: string,
): TechMetrics {
  const assigned = interventions.filter(
    (iv) => iv.assignedTechnicianUid === technicianUid,
  );

  const completed = assigned.filter(
    (iv) => iv.status === "done" || iv.status === "invoiced",
  );
  const cancelled = assigned.filter((iv) => iv.status === "cancelled");
  const waitingMaterial = assigned.filter(
    (iv) => iv.status === "waiting_material",
  );

  const completionRate =
    assigned.length > 0
      ? Math.round((completed.length / assigned.length) * 100)
      : 0;

  // Average response time: time from creation to technician acceptance
  const responseTimes: number[] = [];
  for (const iv of assigned) {
    if (iv.createdAt && iv.technicianAcceptedAt) {
      const created = new Date(iv.createdAt).getTime();
      const accepted = new Date(iv.technicianAcceptedAt).getTime();
      if (!isNaN(created) && !isNaN(accepted) && accepted > created) {
        responseTimes.push((accepted - created) / 60_000);
      }
    }
  }
  const avgResponseMinutes =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        )
      : null;

  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = completed.filter(
    (iv) =>
      iv.completedAt &&
      typeof iv.completedAt === "string" &&
      iv.completedAt.startsWith(today),
  ).length;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();
  const thisWeekCompleted = completed.filter(
    (iv) =>
      iv.completedAt &&
      typeof iv.completedAt === "string" &&
      iv.completedAt >= weekAgoIso,
  ).length;

  const revenueCents = completed.reduce((acc, iv) => acc + (iv.invoiceAmountCents || 0), 0);
  const commissionCents = completed.reduce((acc, iv) => acc + (iv.commissionAmountCents || 0), 0);

  return {
    totalAssigned: assigned.length,
    completed: completed.length,
    cancelled: cancelled.length,
    waitingMaterial: waitingMaterial.length,
    completionRate,
    avgResponseMinutes,
    todayCompleted,
    thisWeekCompleted,
    revenueCents,
    commissionCents,
  };
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

export default function TechnicianPerformanceDashboard({
  interventions,
  technicianUid,
  technicianName,
}: Props) {
  const metrics = useMemo(
    () => computeMetrics(interventions, technicianUid),
    [interventions, technicianUid],
  );

  const cards = [
    {
      label: "Interventions",
      value: metrics.totalAssigned,
      icon: TrendingUp,
      color: "text-slate-700",
      bg: "bg-slate-50",
    },
    {
      label: "Terminées",
      value: metrics.completed,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Aujourd'hui",
      value: metrics.todayCompleted,
      icon: Star,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Cette semaine",
      value: metrics.thisWeekCompleted,
      icon: Trophy,
      color: "text-indigo-700",
      bg: "bg-indigo-50",
    },
    {
      label: "Attente matériel",
      value: metrics.waitingMaterial,
      icon: AlertTriangle,
      color: "text-orange-700",
      bg: "bg-orange-50",
    },
    {
      label: "Temps réponse",
      value: formatResponseTime(metrics.avgResponseMinutes),
      icon: Clock,
      color: "text-violet-700",
      bg: "bg-violet-50",
    },
    {
      label: "Chiffre d'Affaires",
      value: `${(metrics.revenueCents / 100).toFixed(0)} €`,
      icon: Banknote,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Commissions",
      value: `${(metrics.commissionCents / 100).toFixed(0)} €`,
      icon: Coins,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div
      data-testid="technician-performance"
      style={outfit}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-slate-800">
            {technicianName}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Performance terrain
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1",
            metrics.completionRate >= 80
              ? "bg-emerald-100 text-emerald-700"
              : metrics.completionRate >= 50
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-600",
          )}
        >
          <span className="text-[16px] font-black">
            {metrics.completionRate}%
          </span>
          <span className="text-[10px] font-bold">complétion</span>
        </div>
      </div>

      {/* Completion bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            metrics.completionRate >= 80
              ? "bg-emerald-500"
              : metrics.completionRate >= 50
                ? "bg-amber-500"
                : "bg-red-500",
          )}
          style={{ width: `${metrics.completionRate}%` }}
        />
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`flex flex-col items-center gap-1 rounded-xl ${card.bg} px-2 py-3 text-center`}
          >
            <card.icon className={`h-4 w-4 ${card.color}`} />
            <span className={`text-[16px] font-black ${card.color}`}>
              {card.value}
            </span>
            <span className="text-[9px] font-bold text-slate-500 leading-tight">
              {card.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Re-export for use in tests
export { computeMetrics };
