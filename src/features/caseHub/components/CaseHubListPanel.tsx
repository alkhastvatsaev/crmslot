"use client";

import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
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
  pending_needs_address: "bg-orange-100 text-orange-800",
};

type Props = {
  interventions: Intervention[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
};

export default function CaseHubListPanel({ interventions, selectedId, loading, onSelect }: Props) {
  const { t } = useTranslation();

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
      <p
        data-testid="case-hub-list-empty"
        className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-400"
      >
        {t("caseHub.empty")}
      </p>
    );
  }

  return (
    <ul
      data-testid="case-hub-list"
      className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3"
    >
      {interventions.map((iv) => {
        const active = iv.id === selectedId;
        const label = resolveInterventionClientName(iv) || iv.title || iv.id.slice(0, 8);
        const status = iv.status ?? "pending";
        const when = iv.scheduledDate ?? iv.requestedDate ?? null;

        return (
          <li key={iv.id}>
            <button
              type="button"
              data-testid={`case-hub-row-${iv.id}`}
              onClick={() => onSelect(iv.id)}
              className={cn(
                "w-full rounded-[18px] border px-3 py-2.5 text-left shadow-[0_4px_14px_-8px_rgba(15,23,42,0.1)] transition hover:scale-[1.01] active:scale-[0.99]",
                active
                  ? "border-slate-900 bg-slate-900 text-white ring-2 ring-slate-900/15"
                  : "border-black/[0.06] bg-white/95 hover:border-slate-200"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[13px] font-semibold",
                    active ? "text-white" : "text-slate-800"
                  )}
                >
                  {label}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    active
                      ? "bg-white/15 text-white"
                      : (STATUS_CLASS[status] ?? STATUS_CLASS.pending)
                  )}
                >
                  {t(`caseHub.status.${status}` as "caseHub.status.pending")}
                </span>
              </div>
              <p
                className={cn(
                  "mt-1 truncate text-[11px]",
                  active ? "text-white/75" : "text-slate-500"
                )}
              >
                {iv.address?.trim() || "—"}
                {when ? ` · ${when}` : ` · ${t("caseHub.no_date")}`}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
