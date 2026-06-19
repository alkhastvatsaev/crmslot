"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { PatronTechnicianRow } from "@/features/commissionsHub/commissionsHubPatronMetrics";

function formatEur(cents: number): string {
  if (cents <= 0) return "0 €";
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

type Props = {
  rows: PatronTechnicianRow[];
  loading: boolean;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
};

/** Vue patron — qui a gagné combien ce mois + sa règle. */
export default function CommissionsHubTechnicianGrid({
  rows,
  loading,
  selectedUid,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        data-testid="commissions-hub-team-loading"
        className="flex min-h-[200px] flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        data-testid="commissions-hub-team-empty"
        className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400"
      >
        {t("commissionsHub.team.empty")}
      </div>
    );
  }

  return (
    <div
      data-testid="commissions-hub-team-grid"
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-2"
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {rows.map((row) => {
          const active = selectedUid === row.uid;
          const hasEarnings = row.monthEarnedCents > 0;

          return (
            <button
              key={row.uid}
              type="button"
              data-testid={`commissions-hub-tech-${row.uid}`}
              onClick={() => onSelect(row.uid)}
              className={cn(
                "flex min-h-[108px] flex-col items-center justify-center gap-1 rounded-[22px] border bg-white/95 p-3 text-center shadow-[0_6px_18px_-6px_rgba(15,23,42,0.1)] transition hover:scale-[1.02] active:scale-[0.97]",
                active
                  ? "border-slate-900 ring-2 ring-slate-900/15"
                  : hasEarnings
                    ? "border-emerald-200/80 ring-1 ring-emerald-200/60"
                    : "border-black/[0.06] ring-1 ring-slate-200/80 opacity-90"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold",
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {row.initial}
              </span>
              <span className="line-clamp-2 w-full text-[13px] font-semibold text-slate-800">
                {row.name}
              </span>
              <span
                className={cn(
                  "text-xl font-bold tabular-nums leading-none",
                  hasEarnings ? "text-emerald-800" : "text-slate-400"
                )}
              >
                {formatEur(row.monthEarnedCents)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
