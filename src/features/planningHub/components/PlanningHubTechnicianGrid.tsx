"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { PlanningTechnicianRow } from "@/features/planningHub/planningHubTypes";

const STATUS_DOT = {
  available: "bg-emerald-500",
  "on-mission": "bg-amber-500",
  idle: "bg-slate-300",
};

type Props = {
  rows: PlanningTechnicianRow[];
  loading: boolean;
  selectedUid: string | null;
  onSelect: (uid: string) => void;
};

export default function PlanningHubTechnicianGrid({ rows, loading, selectedUid, onSelect }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        data-testid="planning-hub-tech-loading"
        className="flex min-h-[120px] flex-1 items-center justify-center"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        data-testid="planning-hub-tech-empty"
        className="flex flex-1 items-center justify-center px-4 text-center text-sm text-slate-400"
      >
        {t("planningHub.no_technicians")}
      </div>
    );
  }

  return (
    <div
      data-testid="planning-hub-tech-grid"
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3"
    >
      <div className="space-y-2">
        {rows.map((row) => {
          const active = selectedUid === row.uid;
          return (
            <button
              key={row.uid}
              type="button"
              data-testid={`planning-hub-tech-${row.uid}`}
              onClick={() => onSelect(row.uid)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                  : "border-black/[0.06] bg-white/95 hover:scale-[1.01]"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                )}
              >
                {row.initial}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold">{row.name}</span>
                <span
                  className={cn("block text-[10px]", active ? "text-white/75" : "text-slate-500")}
                >
                  {row.missionCount} {t("planningHub.missions_today")}
                </span>
              </span>
              <span
                className={cn("h-2.5 w-2.5 shrink-0 rounded-full", STATUS_DOT[row.status])}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
