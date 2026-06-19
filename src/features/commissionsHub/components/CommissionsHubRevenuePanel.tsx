"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import CommissionsHubStepHeader from "@/features/commissionsHub/components/CommissionsHubStepHeader";
import type {
  PatronMonthlyPoint,
  PatronTrend,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";

type Props = {
  revenueCents: number;
  revenueTrend: PatronTrend;
  series: PatronMonthlyPoint[];
  technicianCount: number;
};

function formatEur(cents: number): string {
  const euros = cents / 100;
  if (euros >= 1000) {
    const k = euros / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded.toString().replace(".", ",")} k€`;
  }
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(euros);
}

function DeltaPill({ trend }: { trend: PatronTrend }) {
  const pct = trend.deltaPct;
  const tone = pct == null ? "neutral" : pct > 0 ? "up" : pct < 0 ? "down" : "neutral";
  const Icon = tone === "up" ? ArrowUp : tone === "down" ? ArrowDown : Minus;
  const palette =
    tone === "up"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "down"
        ? "bg-rose-100 text-rose-800"
        : "bg-slate-100 text-slate-600";
  const label = pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct}%`;

  return (
    <span
      data-testid="commissions-hub-revenue-delta"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
        palette
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

/** Step 1 — Encaisser : CA mois, delta, sparkline revenue. */
export default function CommissionsHubRevenuePanel({
  revenueCents,
  revenueTrend,
  series,
  technicianCount,
}: Props) {
  const { t } = useTranslation();
  const max = Math.max(1, ...series.map((p) => p.revenueCents));
  const lastIdx = series.length - 1;

  return (
    <div
      data-testid="commissions-hub-revenue-panel"
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
    >
      <CommissionsHubStepHeader
        step={1}
        verb={t("commissionsHub.steps.revenue_verb")}
        caption={t("commissionsHub.steps.revenue_caption")}
        tone="revenue"
        testId="commissions-hub-step-1"
      />

      <div
        data-testid="commissions-hub-kpi-strip"
        className="flex flex-col gap-3 rounded-[24px] border border-sky-100/80 bg-gradient-to-b from-sky-50/80 to-white p-4 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)]"
      >
        <div className="flex items-baseline justify-between gap-2">
          <span
            data-testid="commissions-hub-kpi-revenue"
            className="text-[34px] font-black leading-none tabular-nums text-slate-900"
          >
            {formatEur(revenueCents)}
          </span>
          <DeltaPill trend={revenueTrend} />
        </div>
        <span className="text-[11px] font-medium text-slate-600">
          {t("commissionsHub.steps.revenue_hint").replace("{{count}}", String(technicianCount))}
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-[24px] border border-black/[0.06] bg-white/95 px-3 py-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.08)]">
        <div className="flex items-baseline justify-between px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {t("commissionsHub.sparkline.title")}
          </span>
          <span className="text-[10px] font-medium text-slate-500">
            {t("commissionsHub.sparkline.window").replace("{{n}}", String(series.length))}
          </span>
        </div>
        <div className="flex h-16 items-end gap-1.5 px-1">
          {series.map((p, idx) => {
            const ratio = p.revenueCents / max;
            const heightPct = Math.max(6, Math.round(ratio * 100));
            const isCurrent = idx === lastIdx;
            return (
              <div
                key={p.monthKey}
                data-testid={`commissions-hub-sparkline-bar-${p.monthKey}`}
                className="flex flex-1 flex-col items-center justify-end gap-1"
              >
                <div className="flex h-full w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition",
                      isCurrent ? "bg-sky-500" : p.revenueCents > 0 ? "bg-sky-200" : "bg-slate-100"
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase tabular-nums",
                    isCurrent ? "text-sky-700" : "text-slate-400"
                  )}
                >
                  {p.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-center gap-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        <span>{t("commissionsHub.steps.flow_to_distribute")}</span>
        <span aria-hidden>→</span>
      </div>
    </div>
  );
}
