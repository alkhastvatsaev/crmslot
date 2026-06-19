"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import CommissionsHubStepHeader from "@/features/commissionsHub/components/CommissionsHubStepHeader";
import {
  formatRuleShort,
  type PatronTechnicianRow,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";

type Props = {
  rows: PatronTechnicianRow[];
  loading: boolean;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
  totalCents: number;
};

function formatEur(cents: number): string {
  if (cents <= 0) return "0 €";
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const PODIUM_ORDER: Array<{ rankIndex: number; medal: string; tone: string; height: string }> = [
  {
    rankIndex: 1,
    medal: "🥈",
    tone: "bg-gradient-to-b from-slate-100 to-white border-slate-200",
    height: "h-[88px]",
  },
  {
    rankIndex: 0,
    medal: "🥇",
    tone: "bg-gradient-to-b from-amber-100 to-white border-amber-300",
    height: "h-[108px]",
  },
  {
    rankIndex: 2,
    medal: "🥉",
    tone: "bg-gradient-to-b from-orange-100 to-white border-orange-200",
    height: "h-[76px]",
  },
];

function PodiumStep({
  row,
  medal,
  tone,
  height,
  active,
  onClick,
}: {
  row: PatronTechnicianRow | undefined;
  medal: string;
  tone: string;
  height: string;
  active: boolean;
  onClick: (uid: string) => void;
}) {
  if (!row) {
    return (
      <div
        aria-hidden
        className={cn(
          "flex flex-1 flex-col items-center justify-end rounded-t-2xl border border-dashed border-slate-200 bg-white/50 px-1 pt-2",
          height
        )}
      >
        <span className="text-base opacity-40">{medal}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      data-testid={`commissions-hub-tech-${row.uid}`}
      onClick={() => onClick(row.uid)}
      className={cn(
        "group flex flex-1 flex-col items-center justify-end gap-1 rounded-t-2xl border px-2 py-2 text-center transition hover:-translate-y-0.5 active:translate-y-0",
        tone,
        height,
        active && "ring-2 ring-slate-900/30"
      )}
    >
      <span className="text-base leading-none">{medal}</span>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
        {row.initial}
      </span>
      <span className="line-clamp-1 w-full text-[10px] font-semibold text-slate-700">
        {row.name}
      </span>
      <span className="text-[12px] font-bold tabular-nums leading-none text-slate-900">
        {formatEur(row.monthEarnedCents)}
      </span>
    </button>
  );
}

/** Step 2 — Distribuer : podium top 3 + ranking. */
export default function CommissionsHubDistributionPanel({
  rows,
  loading,
  selectedUid,
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
        <CommissionsHubStepHeader
          step={2}
          verb={t("commissionsHub.steps.distribute_verb")}
          caption={t("commissionsHub.steps.distribute_caption")}
          tone="distribution"
          testId="commissions-hub-step-2"
        />
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
        <CommissionsHubStepHeader
          step={2}
          verb={t("commissionsHub.steps.distribute_verb")}
          caption={t("commissionsHub.steps.distribute_caption")}
          tone="distribution"
          testId="commissions-hub-step-2"
        />
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400">
          {t("commissionsHub.team.empty")}
        </div>
      </div>
    );
  }

  const top = rows[0]?.monthEarnedCents ?? 0;
  const rest = rows.slice(3);

  return (
    <div
      data-testid="commissions-hub-team-grid"
      className="flex min-h-0 flex-1 flex-col gap-3 px-3 py-3"
    >
      <CommissionsHubStepHeader
        step={2}
        verb={t("commissionsHub.steps.distribute_verb")}
        caption={t("commissionsHub.steps.distribute_caption")}
        tone="distribution"
        testId="commissions-hub-step-2"
      />

      <div className="flex flex-col gap-2 rounded-[24px] border border-emerald-100/80 bg-gradient-to-b from-emerald-50/70 to-white p-3 shadow-[0_6px_18px_-6px_rgba(15,23,42,0.12)]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/80">
          {t("commissionsHub.steps.distribute_total")}
        </span>
        <span
          data-testid="commissions-hub-kpi-total"
          className="text-[30px] font-black leading-none tabular-nums text-emerald-900"
        >
          {formatEur(totalCents)}
        </span>
        <div className="mt-2 flex items-end gap-1.5">
          {PODIUM_ORDER.map(({ rankIndex, medal, tone, height }) => (
            <PodiumStep
              key={rankIndex}
              row={rows[rankIndex]}
              medal={medal}
              tone={tone}
              height={height}
              active={selectedUid === rows[rankIndex]?.uid}
              onClick={onSelect}
            />
          ))}
        </div>
      </div>

      {rest.length > 0 ? (
        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {rest.map((row, idx) => {
            const realRank = idx + 3;
            const active = selectedUid === row.uid;
            const ratio = top > 0 ? row.monthEarnedCents / top : 0;
            const hasEarnings = row.monthEarnedCents > 0;
            return (
              <button
                key={row.uid}
                type="button"
                data-testid={`commissions-hub-tech-${row.uid}`}
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
                  #{realRank + 1}
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
                  <span className="truncate text-[10px] text-slate-500">
                    {row.missionCount} {t("commissionsHub.team.missions")}
                    {row.manualBonusCents > 0 ? ` · +${formatEur(row.manualBonusCents)}` : ""}
                  </span>
                </span>
                <span className="relative flex flex-col items-end">
                  <span
                    className={cn(
                      "text-[13px] font-bold tabular-nums leading-none",
                      hasEarnings ? "text-emerald-800" : "text-slate-400"
                    )}
                  >
                    {formatEur(row.monthEarnedCents)}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-semibold uppercase",
                      row.hasPersonalRule ? "text-violet-600" : "text-sky-600"
                    )}
                  >
                    {formatRuleShort(row.displayRule)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 text-center text-[11px] text-slate-400">
          {t("commissionsHub.steps.distribute_only_podium")}
        </div>
      )}

      <div className="mt-auto flex items-center justify-center gap-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">
        <span aria-hidden>→</span>
        <span>{t("commissionsHub.steps.flow_to_rules")}</span>
      </div>
    </div>
  );
}
