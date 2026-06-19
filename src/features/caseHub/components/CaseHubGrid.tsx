"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";

const STATUS_RING: Record<string, string> = {
  pending: "ring-slate-200",
  assigned: "ring-sky-200",
  en_route: "ring-indigo-200",
  in_progress: "ring-violet-200",
  waiting_material: "ring-amber-200",
  done: "ring-emerald-200",
  invoiced: "ring-green-200",
  cancelled: "ring-red-200",
};

type Props = {
  interventions: Intervention[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function CaseHubGrid({ interventions, loading, selectedId, onSelect }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div
        data-testid="case-hub-list-loading"
        className="flex min-h-[200px] flex-1 items-center justify-center"
        aria-busy="true"
      >
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    );
  }

  if (interventions.length === 0) {
    return (
      <div
        data-testid="case-hub-list-empty"
        className="flex flex-1 items-center justify-center px-6 text-center text-sm text-slate-400"
      >
        {t("caseHub.empty")}
      </div>
    );
  }

  return (
    <div
      data-testid="case-hub-grid"
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-2"
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {interventions.map((iv) => {
          const active = iv.id === selectedId;
          const label = resolveInterventionClientName(iv) || iv.title || iv.id.slice(-6);
          const status = iv.status ?? "pending";

          return (
            <button
              key={iv.id}
              type="button"
              data-testid={`case-hub-row-${iv.id}`}
              onClick={() => onSelect(iv.id)}
              className={cn(
                "flex min-h-[108px] flex-col items-start justify-between gap-1 rounded-[22px] border bg-white/95 p-3 text-left shadow-[0_6px_18px_-6px_rgba(15,23,42,0.1)] transition hover:scale-[1.02] active:scale-[0.97]",
                active
                  ? "border-slate-900 ring-2 ring-slate-900/15"
                  : cn("border-black/[0.06] ring-1", STATUS_RING[status] ?? STATUS_RING.pending)
              )}
            >
              <span className="line-clamp-2 w-full text-[13px] font-semibold text-slate-800">
                {label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {t(`caseHub.status.${status}` as "caseHub.status.pending")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
