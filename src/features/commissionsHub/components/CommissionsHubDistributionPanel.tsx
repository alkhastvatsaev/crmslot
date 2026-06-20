"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  resolveTechnicianPayablePreviewCents,
  resolveTechnicianRateValue,
  type PatronTechnicianRow,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
import {
  formatCommissionValue,
  formatPatronEuros,
} from "@/features/commissionsHub/commissionsHubFormat";

type Props = {
  rows: PatronTechnicianRow[];
  loading: boolean;
  selectedUid: string | null;
  pendingRateByUid: Record<string, number>;
  onSelect: (uid: string) => void;
  totalCents: number;
};

type PodiumTone = {
  rankLabel: string;
  step: string;
  badge: string;
  accent: string;
  height: string;
};

const PODIUM_ORDER: Array<{ rankIndex: number; tone: PodiumTone }> = [
  {
    rankIndex: 1,
    tone: {
      rankLabel: "02",
      step: "bg-gradient-to-b from-slate-100/90 to-white border-slate-200/80",
      badge: "bg-gradient-to-br from-slate-200 to-slate-50 text-slate-700 border-slate-300/70",
      accent: "text-slate-500",
      height: "h-[88px]",
    },
  },
  {
    rankIndex: 0,
    tone: {
      rankLabel: "01",
      step: "bg-gradient-to-b from-amber-50/90 to-white border-amber-200/80",
      badge:
        "bg-gradient-to-br from-amber-200 to-amber-50 text-amber-900 border-amber-300/80 shadow-[0_2px_8px_-2px_rgba(180,140,30,0.35)]",
      accent: "text-amber-700",
      height: "h-[108px]",
    },
  },
  {
    rankIndex: 2,
    tone: {
      rankLabel: "03",
      step: "bg-gradient-to-b from-orange-50/80 to-white border-orange-200/70",
      badge:
        "bg-gradient-to-br from-orange-200/90 to-orange-50 text-orange-900 border-orange-300/70",
      accent: "text-orange-700",
      height: "h-[76px]",
    },
  },
];

function PodiumStep({
  row,
  payableCents,
  tone,
  active,
  onClick,
}: {
  row: PatronTechnicianRow | undefined;
  payableCents: number;
  tone: PodiumTone;
  active: boolean;
  onClick: (uid: string) => void;
}) {
  if (!row) {
    return (
      <div
        aria-hidden
        className={cn(
          "flex flex-1 flex-col items-center justify-end rounded-t-2xl border border-dashed border-slate-200 bg-white/40 px-1 pt-2",
          tone.height
        )}
      >
        <span
          className={cn(
            "text-[11px] font-semibold tracking-[0.18em] tabular-nums opacity-30",
            tone.accent
          )}
        >
          {tone.rankLabel}
        </span>
      </div>
    );
  }
  return (
    <button
      type="button"
      data-testid={`commissions-hub-tech-${row.uid}`}
      onClick={() => onClick(row.uid)}
      className={cn(
        "group relative flex flex-1 flex-col items-center justify-end gap-1 rounded-t-2xl border px-2 py-2 text-center transition hover:-translate-y-0.5 active:translate-y-0",
        tone.step,
        tone.height,
        active && "ring-2 ring-slate-900/25"
      )}
    >
      <span
        className={cn(
          "absolute top-1.5 right-2 text-[10px] font-semibold tracking-[0.18em] tabular-nums",
          tone.accent
        )}
      >
        {tone.rankLabel}
      </span>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-bold",
          tone.badge
        )}
      >
        {row.initial}
      </span>
      <span className="line-clamp-1 w-full text-[10px] font-semibold text-slate-700">
        {row.name}
      </span>
      <span className="text-[12px] font-bold tabular-nums leading-none text-slate-900">
        {formatPatronEuros(payableCents)}
      </span>
    </button>
  );
}

/** Step 2 — Distribuer : podium top 3 + ranking. */
export default function CommissionsHubDistributionPanel({
  rows,
  loading,
  selectedUid,
  pendingRateByUid,
  onSelect,
  totalCents,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        data-testid="commissions-hub-team-loading"
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
      >
        <div className="flex min-h-[200px] flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        data-testid="commissions-hub-team-empty"
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
      >
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
          {t("commissionsHub.team.empty")}
        </div>
      </div>
    );
  }

  const rankedRows = [...rows]
    .map((row) => ({
      row,
      payableCents: resolveTechnicianPayablePreviewCents(row, pendingRateByUid[row.uid]),
    }))
    .sort((a, b) => b.payableCents - a.payableCents);

  const top = rankedRows[0]?.payableCents ?? 0;

  return (
    <div
      data-testid="commissions-hub-team-grid"
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
    >
      <div className="flex flex-col gap-2 rounded-[24px] border border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 to-white p-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">
          {t("commissionsHub.steps.distribute_total")}
        </span>
        <span
          data-testid="commissions-hub-kpi-total"
          className="text-[30px] font-black leading-none tabular-nums text-emerald-900"
        >
          {formatPatronEuros(totalCents)}
        </span>
        <div className="mt-2 flex items-end gap-1.5">
          {PODIUM_ORDER.map(({ rankIndex, tone }) => (
            <PodiumStep
              key={rankIndex}
              row={rankedRows[rankIndex]?.row}
              payableCents={rankedRows[rankIndex]?.payableCents ?? 0}
              tone={tone}
              active={selectedUid === rankedRows[rankIndex]?.row.uid}
              onClick={onSelect}
            />
          ))}
        </div>
      </div>

      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {rankedRows.map(({ row, payableCents }, idx) => {
          const active = selectedUid === row.uid;
          const ratio = top > 0 ? payableCents / top : 0;
          const hasPayable = payableCents > 0;
          const { valueType, value } = resolveTechnicianRateValue(row, pendingRateByUid[row.uid]);
          const rateLabel = formatCommissionValue(valueType, value);
          return (
            <button
              key={row.uid}
              type="button"
              data-testid={`commissions-hub-tech-row-${row.uid}`}
              onClick={() => onSelect(row.uid)}
              className={cn(
                "relative flex items-center gap-2 overflow-hidden rounded-xl border bg-white/95 px-3 py-2 text-left transition active:scale-[0.99]",
                active
                  ? "border-slate-900 ring-2 ring-slate-900/15"
                  : "border-black/[0.06] hover:border-slate-300"
              )}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 bg-emerald-50/70"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
              <span className="relative w-6 text-[11px] font-bold tabular-nums text-slate-500">
                #{idx + 1}
              </span>
              <span
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold",
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {row.initial}
              </span>
              <span className="relative flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12px] font-semibold text-slate-800">
                  {row.name}
                </span>
                <span
                  data-testid={`commissions-hub-tech-row-meta-${row.uid}`}
                  className="truncate text-[10px] text-slate-500"
                >
                  {row.revenueMissionCount > 0
                    ? t("commissionsHub.team.revenue_missions")
                        .replace("{{count}}", String(row.revenueMissionCount))
                        .replace("{{revenue}}", formatPatronEuros(row.monthRevenueCents))
                    : `${row.missionCount} ${t("commissionsHub.team.missions")}`}
                  {row.manualBonusCents > 0 ? ` · +${formatPatronEuros(row.manualBonusCents)}` : ""}
                </span>
              </span>
              <span className="relative flex flex-col items-end">
                <span
                  data-testid={`commissions-hub-tech-payable-${row.uid}`}
                  className={cn(
                    "text-[13px] font-bold tabular-nums leading-none",
                    hasPayable ? "text-emerald-800" : "text-slate-400"
                  )}
                >
                  {formatPatronEuros(payableCents)}
                </span>
                <span
                  className={cn(
                    "mt-0.5 text-[10px] font-semibold uppercase",
                    row.hasPersonalRule ? "text-violet-600" : "text-sky-600"
                  )}
                >
                  {rateLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
