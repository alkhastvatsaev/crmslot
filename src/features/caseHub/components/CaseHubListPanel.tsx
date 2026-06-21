"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { Intervention } from "@/features/interventions/types";
import { resolveInterventionClientName } from "@/features/interventions/resolveInterventionClientName";
import { bucketForStatus } from "@/features/caseHub/caseHubPatronMetrics";
import type { CaseHubBucket } from "@/features/caseHub/caseHubTypes";

const BUCKET_BORDER: Record<CaseHubBucket, string> = {
  to_assign: "border-l-rose-500",
  in_progress: "border-l-violet-500",
  waiting: "border-l-amber-500",
  to_invoice: "border-l-emerald-500",
  invoiced: "border-l-green-500",
  cancelled: "border-l-slate-400",
  all: "border-l-slate-300",
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
        const bucket = bucketForStatus(status);
        const when = iv.scheduledDate ?? iv.requestedDate ?? null;
        const action = t(`caseHub.next_action.${status}` as "caseHub.next_action.pending");

        return (
          <li key={iv.id}>
            <button
              type="button"
              data-testid={`case-hub-row-${iv.id}`}
              onClick={() => onSelect(iv.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-[16px] border border-l-4 bg-white/95 px-3 py-3 text-left shadow-[0_4px_14px_-8px_rgba(15,23,42,0.1)] transition hover:scale-[1.01] active:scale-[0.99]",
                BUCKET_BORDER[bucket],
                active
                  ? "border-y-slate-900 border-r-slate-900 bg-slate-50 ring-2 ring-slate-900/15"
                  : "border-y-black/[0.06] border-r-black/[0.06] hover:border-y-slate-200 hover:border-r-slate-200"
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[14px] font-bold text-slate-900">{label}</span>
                <span className="truncate text-[11px] text-slate-500">
                  {iv.address?.trim() || "—"}
                  {when ? ` · ${when}` : ` · ${t("caseHub.no_date")}`}
                </span>
                <span
                  data-testid={`case-hub-row-action-${iv.id}`}
                  className="mt-0.5 truncate text-[12px] font-semibold text-slate-700 group-hover:text-slate-900"
                >
                  {action}
                </span>
              </div>
              <ChevronRight
                className={cn(
                  "h-5 w-5 shrink-0 transition",
                  active
                    ? "text-slate-900"
                    : "text-slate-300 group-hover:translate-x-0.5 group-hover:text-slate-500"
                )}
                aria-hidden
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
