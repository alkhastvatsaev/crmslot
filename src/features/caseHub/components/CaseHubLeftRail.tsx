"use client";

import { Archive, CircleDot, FolderOpen, List } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/core/i18n/I18nContext";
import type { CaseHubStatusFilter } from "@/features/caseHub/caseHubTypes";

type Props = {
  filter: CaseHubStatusFilter;
  onFilterChange: (filter: CaseHubStatusFilter) => void;
  counts: Record<CaseHubStatusFilter, number>;
};

const FILTER_META: {
  id: CaseHubStatusFilter;
  icon: typeof List;
  testId: string;
}[] = [
  { id: "all", icon: List, testId: "case-hub-filter-all" },
  { id: "open", icon: FolderOpen, testId: "case-hub-filter-open" },
  { id: "active", icon: CircleDot, testId: "case-hub-filter-active" },
  { id: "done", icon: Archive, testId: "case-hub-filter-done" },
];

export default function CaseHubLeftRail({ filter, onFilterChange, counts }: Props) {
  const { t } = useTranslation();

  return (
    <div
      data-testid="case-hub-left-rail"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3"
    >
      <div className="grid grid-cols-2 gap-2">
        {FILTER_META.map(({ id, icon: Icon, testId }) => {
          const active = filter === id;
          return (
            <button
              key={id}
              type="button"
              data-testid={testId}
              onClick={() => onFilterChange(id)}
              className={cn(
                "flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-[18px] border text-center transition active:scale-[0.97]",
                active
                  ? "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_-8px_rgba(15,23,42,0.45)]"
                  : "border-black/[0.06] bg-white/95 text-slate-600 ring-1 ring-black/[0.04] hover:scale-[1.02]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-base font-bold tabular-nums leading-none">{counts[id]}</span>
              <span className="text-[8px] font-semibold uppercase tracking-wide opacity-85">
                {t(`caseHub.filter.${id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
