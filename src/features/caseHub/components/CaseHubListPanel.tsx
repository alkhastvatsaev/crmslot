"use client";

import { cn } from "@/lib/utils";
import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  assigned: "bg-blue-100 text-blue-700",
  en_route: "bg-indigo-100 text-indigo-700",
  in_progress: "bg-violet-100 text-violet-700",
  waiting_material: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-700",
  invoiced: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-600",
};

type Props = {
  interventions: Intervention[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
};

export default function CaseHubListPanel({ interventions, selectedId, loading, onSelect }: Props) {
  if (loading) {
    return (
      <div
        data-testid="case-hub-list-loading"
        className="flex flex-1 items-center justify-center p-6"
        aria-busy="true"
      >
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (interventions.length === 0) {
    return (
      <p data-testid="case-hub-list-empty" className="p-4 text-sm text-slate-500">
        Aucun dossier pour cette société.
      </p>
    );
  }

  return (
    <ul
      data-testid="case-hub-list"
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
    >
      {interventions.map((iv) => {
        const active = iv.id === selectedId;
        const label = resolveInterventionClientName(iv) || iv.title || iv.id.slice(0, 8);
        const status = iv.status ?? "pending";
        return (
          <li key={iv.id}>
            <button
              type="button"
              data-testid={`case-hub-row-${iv.id}`}
              onClick={() => onSelect(iv.id)}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left transition",
                active
                  ? "border-sky-300 bg-sky-50 shadow-sm"
                  : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-slate-800">{label}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                    STATUS_CLASS[status] ?? STATUS_CLASS.pending
                  )}
                >
                  {status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-500">
                {iv.address || "—"} · {iv.scheduledDate ?? iv.requestedDate ?? "sans date"}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
